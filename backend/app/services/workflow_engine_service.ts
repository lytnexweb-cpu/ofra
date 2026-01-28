import Transaction from '#models/transaction'
import TransactionStep from '#models/transaction_step'
import WorkflowTemplate from '#models/workflow_template'
import WorkflowStep from '#models/workflow_step'
import Condition from '#models/condition'
import { ActivityFeedService } from '#services/activity_feed_service'
import { AutomationExecutorService } from '#services/automation_executor_service'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'

interface CreateTransactionParams {
  templateId: number
  ownerUserId: number
  clientId: number
  propertyId?: number | null
  type: 'purchase' | 'sale'
  salePrice?: number | null
  listPrice?: number | null
  commission?: number | null
  notesText?: string | null
  folderUrl?: string | null
  organizationId?: number | null
}

interface AdvanceOptions {
  skipBlockingCheck?: boolean
}

export class WorkflowEngineService {
  /**
   * Create a transaction from a workflow template.
   * Instantiates all steps, activates the first, and creates its conditions.
   */
  static async createTransactionFromTemplate(params: CreateTransactionParams): Promise<Transaction> {
    const template = await WorkflowTemplate.query()
      .where('id', params.templateId)
      .preload('steps', (q) => {
        q.orderBy('step_order', 'asc')
          .preload('conditions', (cq) => cq.orderBy('sort_order', 'asc'))
          .preload('automations')
      })
      .firstOrFail()

    // Create the transaction
    const transaction = await Transaction.create({
      ownerUserId: params.ownerUserId,
      clientId: params.clientId,
      propertyId: params.propertyId ?? null,
      type: params.type,
      workflowTemplateId: template.id,
      organizationId: params.organizationId ?? null,
      salePrice: params.salePrice ?? null,
      listPrice: params.listPrice ?? null,
      commission: params.commission ?? null,
      notesText: params.notesText ?? null,
      folderUrl: params.folderUrl ?? null,
    })

    // Instantiate all steps
    const transactionSteps: TransactionStep[] = []
    for (const wfStep of template.steps) {
      const txStep = await TransactionStep.create({
        transactionId: transaction.id,
        workflowStepId: wfStep.id,
        stepOrder: wfStep.stepOrder,
        status: 'pending',
        enteredAt: null,
        completedAt: null,
      })
      transactionSteps.push(txStep)
    }

    // Activate the first step
    if (transactionSteps.length > 0) {
      const firstStep = transactionSteps[0]
      firstStep.status = 'active'
      firstStep.enteredAt = DateTime.now()
      await firstStep.save()

      transaction.currentStepId = firstStep.id
      await transaction.save()

      // Create conditions for first step
      const firstWfStep = template.steps[0]
      await this.createConditionsFromTemplate(transaction.id, firstStep.id, firstWfStep)

      // Execute on_enter automations for first step
      await this.executeAutomations(firstWfStep, 'on_enter', transaction.id)

      // Log activity
      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: params.ownerUserId,
        activityType: 'transaction_created',
        metadata: {
          templateName: template.name,
          templateId: template.id,
        },
      })
      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: params.ownerUserId,
        activityType: 'step_entered',
        metadata: {
          stepName: firstWfStep.name,
          stepOrder: firstWfStep.stepOrder,
        },
      })
    }

    return transaction
  }

  /**
   * Advance to the next step.
   * Checks blocking conditions on current step unless skipBlockingCheck is true.
   */
  static async advanceStep(
    transactionId: number,
    userId: number,
    options?: AdvanceOptions
  ): Promise<{ transaction: Transaction; newStep: TransactionStep | null }> {
    const transaction = await Transaction.query()
      .where('id', transactionId)
      .preload('transactionSteps', (q) => q.orderBy('step_order', 'asc'))
      .firstOrFail()

    const currentStep = transaction.transactionSteps.find(
      (s) => s.id === transaction.currentStepId
    )

    if (!currentStep) {
      throw new Error('No active step found for this transaction')
    }

    // Guard against duplicate calls (double-click, retry)
    await currentStep.refresh()
    if (currentStep.status !== 'active') {
      const error: any = new Error('Step is no longer active — possible duplicate request')
      error.code = 'E_STEP_NOT_ACTIVE'
      throw error
    }

    // Check blocking conditions
    if (!options?.skipBlockingCheck) {
      const blocking = await this.checkBlockingConditions(currentStep.id)
      if (blocking.length > 0) {
        const titles = blocking.map((c) => c.title).join(', ')
        const error: any = new Error(
          `Cannot advance: ${blocking.length} blocking condition(s) pending: ${titles}`
        )
        error.code = 'E_BLOCKING_CONDITIONS'
        error.blockingConditions = blocking
        throw error
      }
    }

    // Complete the current step
    const currentWfStep = await WorkflowStep.query()
      .where('id', currentStep.workflowStepId)
      .preload('automations')
      .firstOrFail()

    // Execute on_exit automations
    await this.executeAutomations(currentWfStep, 'on_exit', transactionId)

    currentStep.status = 'completed'
    currentStep.completedAt = DateTime.now()
    await currentStep.save()

    await ActivityFeedService.log({
      transactionId,
      userId,
      activityType: 'step_completed',
      metadata: {
        stepName: currentWfStep.name,
        stepOrder: currentStep.stepOrder,
      },
    })

    // Find the next step
    const nextStep = transaction.transactionSteps.find(
      (s) => s.stepOrder === currentStep.stepOrder + 1
    )

    if (!nextStep) {
      // No more steps — transaction is complete
      transaction.currentStepId = null
      await transaction.save()
      return { transaction, newStep: null }
    }

    // Activate the next step
    nextStep.status = 'active'
    nextStep.enteredAt = DateTime.now()
    await nextStep.save()

    transaction.currentStepId = nextStep.id
    await transaction.save()

    // Load the workflow step for conditions/automations
    const nextWfStep = await WorkflowStep.query()
      .where('id', nextStep.workflowStepId)
      .preload('conditions', (q) => q.orderBy('sort_order', 'asc'))
      .preload('automations')
      .firstOrFail()

    // Create conditions for new step
    await this.createConditionsFromTemplate(transactionId, nextStep.id, nextWfStep)

    // Execute on_enter automations
    await this.executeAutomations(nextWfStep, 'on_enter', transactionId)

    await ActivityFeedService.log({
      transactionId,
      userId,
      activityType: 'step_entered',
      metadata: {
        stepName: nextWfStep.name,
        stepOrder: nextStep.stepOrder,
      },
    })

    return { transaction, newStep: nextStep }
  }

  /**
   * Skip the current step without checking blocking conditions.
   */
  static async skipStep(
    transactionId: number,
    userId: number
  ): Promise<{ transaction: Transaction; newStep: TransactionStep | null }> {
    const transaction = await Transaction.query()
      .where('id', transactionId)
      .preload('transactionSteps', (q) => q.orderBy('step_order', 'asc'))
      .firstOrFail()

    const currentStep = transaction.transactionSteps.find(
      (s) => s.id === transaction.currentStepId
    )

    if (!currentStep) {
      throw new Error('No active step found for this transaction')
    }

    // Guard against duplicate calls (double-click, retry)
    await currentStep.refresh()
    if (currentStep.status !== 'active') {
      const error: any = new Error('Step is no longer active — possible duplicate request')
      error.code = 'E_STEP_NOT_ACTIVE'
      throw error
    }

    // Mark as skipped
    currentStep.status = 'skipped'
    currentStep.completedAt = DateTime.now()
    await currentStep.save()

    const wfStep = await WorkflowStep.find(currentStep.workflowStepId)

    await ActivityFeedService.log({
      transactionId,
      userId,
      activityType: 'step_skipped',
      metadata: {
        stepName: wfStep?.name ?? 'Unknown',
        stepOrder: currentStep.stepOrder,
      },
    })

    // Find the next step
    const nextStep = transaction.transactionSteps.find(
      (s) => s.stepOrder === currentStep.stepOrder + 1
    )

    if (!nextStep) {
      transaction.currentStepId = null
      await transaction.save()
      return { transaction, newStep: null }
    }

    // Activate next step
    nextStep.status = 'active'
    nextStep.enteredAt = DateTime.now()
    await nextStep.save()

    transaction.currentStepId = nextStep.id
    await transaction.save()

    const nextWfStep = await WorkflowStep.query()
      .where('id', nextStep.workflowStepId)
      .preload('conditions', (q) => q.orderBy('sort_order', 'asc'))
      .preload('automations')
      .firstOrFail()

    await this.createConditionsFromTemplate(transactionId, nextStep.id, nextWfStep)
    await this.executeAutomations(nextWfStep, 'on_enter', transactionId)

    await ActivityFeedService.log({
      transactionId,
      userId,
      activityType: 'step_entered',
      metadata: {
        stepName: nextWfStep.name,
        stepOrder: nextStep.stepOrder,
      },
    })

    return { transaction, newStep: nextStep }
  }

  /**
   * Go to a specific step (e.g. go back).
   * Resets steps between current and target as pending.
   */
  static async goToStep(
    transactionId: number,
    targetStepOrder: number,
    userId: number
  ): Promise<{ transaction: Transaction; newStep: TransactionStep }> {
    const transaction = await Transaction.query()
      .where('id', transactionId)
      .preload('transactionSteps', (q) => q.orderBy('step_order', 'asc'))
      .firstOrFail()

    const targetStep = transaction.transactionSteps.find(
      (s) => s.stepOrder === targetStepOrder
    )

    if (!targetStep) {
      throw new Error(`Step with order ${targetStepOrder} not found`)
    }

    // Reset all steps from target onward to pending (except target, which becomes active)
    for (const step of transaction.transactionSteps) {
      if (step.stepOrder > targetStepOrder) {
        step.status = 'pending'
        step.enteredAt = null
        step.completedAt = null
        await step.save()
      } else if (step.stepOrder === targetStepOrder) {
        step.status = 'active'
        step.enteredAt = DateTime.now()
        step.completedAt = null
        await step.save()
      }
    }

    transaction.currentStepId = targetStep.id
    await transaction.save()

    const wfStep = await WorkflowStep.query()
      .where('id', targetStep.workflowStepId)
      .preload('conditions', (q) => q.orderBy('sort_order', 'asc'))
      .preload('automations')
      .firstOrFail()

    await ActivityFeedService.log({
      transactionId,
      userId,
      activityType: 'step_entered',
      metadata: {
        stepName: wfStep.name,
        stepOrder: targetStepOrder,
        navigationType: 'goto',
      },
    })

    return { transaction, newStep: targetStep }
  }

  /**
   * Return all pending blocking conditions for a transaction step.
   */
  static async checkBlockingConditions(transactionStepId: number): Promise<Condition[]> {
    return Condition.query()
      .where('transactionStepId', transactionStepId)
      .where('isBlocking', true)
      .where('status', 'pending')
  }

  /**
   * Get the current status summary for a transaction.
   */
  static async getCurrentStatus(transactionId: number) {
    const transaction = await Transaction.query()
      .where('id', transactionId)
      .preload('transactionSteps', (q) => q.orderBy('step_order', 'asc'))
      .preload('currentStep', (q) => {
        q.preload('workflowStep')
      })
      .firstOrFail()

    const totalSteps = transaction.transactionSteps.length
    const completedSteps = transaction.transactionSteps.filter(
      (s) => s.status === 'completed' || s.status === 'skipped'
    ).length
    const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

    const currentStepData = transaction.currentStep
    const currentStepName = currentStepData?.workflowStep?.name ?? null
    const currentStepOrder = currentStepData?.stepOrder ?? null

    return {
      transactionId,
      currentStepName,
      currentStepOrder,
      totalSteps,
      completedSteps,
      progress,
    }
  }

  /**
   * Create instance-level conditions from the workflow step template.
   */
  private static async createConditionsFromTemplate(
    transactionId: number,
    transactionStepId: number,
    workflowStep: WorkflowStep
  ): Promise<void> {
    if (!workflowStep.conditions || workflowStep.conditions.length === 0) return

    const now = DateTime.now()

    for (const tplCond of workflowStep.conditions) {
      const dueDate = tplCond.dueDateOffsetDays
        ? now.plus({ days: tplCond.dueDateOffsetDays })
        : null

      await Condition.create({
        transactionId,
        transactionStepId,
        title: tplCond.title,
        description: tplCond.description,
        type: tplCond.conditionType as any,
        priority: tplCond.priority,
        isBlocking: tplCond.isBlockingDefault,
        status: 'pending',
        dueDate,
      })
    }
  }

  /**
   * Execute automations for a given trigger type.
   * Dispatches each matching automation through AutomationExecutorService.
   * Errors are caught and logged — never blocks step advancement.
   */
  private static async executeAutomations(
    workflowStep: WorkflowStep,
    trigger: 'on_enter' | 'on_exit' | 'on_condition_complete',
    transactionId: number
  ): Promise<void> {
    if (!workflowStep.automations) return

    const matchingAutomations = workflowStep.automations.filter(
      (a) => a.trigger === trigger
    )

    for (const automation of matchingAutomations) {
      try {
        await AutomationExecutorService.execute(automation, transactionId, {
          stepName: workflowStep.name,
          trigger,
        })
      } catch (err) {
        logger.error(
          { err, automationId: automation.id, transactionId },
          'Automation execution failed — continuing step advancement'
        )
      }
    }
  }
}
