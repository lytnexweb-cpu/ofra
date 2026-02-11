import Transaction from '#models/transaction'
import TransactionStep from '#models/transaction_step'
import WorkflowTemplate from '#models/workflow_template'
import WorkflowStep from '#models/workflow_step'
import Condition from '#models/condition'
import Note from '#models/note'
import Offer from '#models/offer'
import TransactionProfile from '#models/transaction_profile'
import { ActivityFeedService } from '#services/activity_feed_service'
import { AutomationExecutorService } from '#services/automation_executor_service'
import { ConditionsEngineService } from '#services/conditions_engine_service'
import type { ResolutionType } from '#models/condition'
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
  /** D1: Transaction Profile for Premium conditions */
  profile?: {
    propertyType: 'house' | 'condo' | 'land'
    propertyContext: 'urban' | 'suburban' | 'rural'
    isFinanced: boolean
    hasWell?: boolean
    hasSeptic?: boolean
    accessType?: 'public' | 'private' | 'right_of_way'
    condoDocsRequired?: boolean
    appraisalRequired?: boolean | null
  }
  /** Sprint 1: When false, skip ALL auto-condition creation */
  autoConditionsEnabled?: boolean
}

interface ConditionResolutionInput {
  conditionId: number
  resolutionType: ResolutionType
  note?: string
}

interface AdvanceOptions {
  skipBlockingCheck?: boolean
  /** D4: Required condition resolutions for step advancement */
  requiredResolutions?: ConditionResolutionInput[]
  /** Optional note to attach when validating the step */
  note?: string
  /** Whether to notify parties by email */
  notifyEmail?: boolean
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
    const autoConditionsEnabled = params.autoConditionsEnabled ?? true
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
      autoConditionsEnabled,
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

      const firstWfStep = template.steps[0]

      // D1/D27: Create transaction profile if provided
      if (params.profile) {
        await TransactionProfile.create({
          transactionId: transaction.id,
          propertyType: params.profile.propertyType,
          propertyContext: params.profile.propertyContext,
          isFinanced: params.profile.isFinanced,
          hasWell: params.profile.hasWell,
          hasSeptic: params.profile.hasSeptic,
          accessType: params.profile.accessType,
          condoDocsRequired: params.profile.condoDocsRequired ?? true,
          appraisalRequired: params.profile.appraisalRequired,
        })
      }

      // Create conditions only if autoConditionsEnabled
      if (autoConditionsEnabled) {
        if (params.profile) {
          // Premium: Create conditions from templates based on profile
          try {
            await ConditionsEngineService.createConditionsFromProfile(
              transaction.id,
              firstStep.id,
              1, // First step
              params.ownerUserId
            )
          } catch (err) {
            logger.warn({ transactionId: transaction.id, err }, 'Failed to create Premium conditions')
          }
        } else {
          // Legacy: Create conditions from workflow step template (no profile)
          await this.createConditionsFromTemplate(transaction.id, firstStep.id, firstWfStep)
        }
      }

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
   * Implements D4: Archivage des Conditions dans la Timeline
   *
   * - Blocking conditions must be resolved before advancement
   * - Required conditions need explicit resolution (via options.requiredResolutions)
   * - Recommended conditions are auto-archived as 'not_applicable'
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

    const currentStepOrder = currentStep.stepOrder

    // Offer gate: negotiation step requires an accepted offer
    const currentWfStepForGate = await WorkflowStep.find(currentStep.workflowStepId)
    const slug = currentWfStepForGate?.slug ?? ''
    if (['negotiation', 'en-negociation', 'offer-submitted'].includes(slug)) {
      const acceptedOffer = await Offer.query()
        .where('transactionId', transactionId)
        .where('status', 'accepted')
        .first()
      if (!acceptedOffer) {
        const error: any = new Error('Cannot advance: an accepted offer is required to complete the negotiation step')
        error.code = 'E_ACCEPTED_OFFER_REQUIRED'
        throw error
      }
    }

    // D4: Check step advancement using Premium logic
    if (!options?.skipBlockingCheck) {
      const check = await ConditionsEngineService.checkStepAdvancement(
        transactionId,
        currentStepOrder
      )

      // Blocking conditions must all be resolved
      if (!check.canAdvance) {
        const titles = check.blockingConditions.map((c) => c.getLabel('fr')).join(', ')
        const error: any = new Error(
          `Cannot advance: ${check.blockingConditions.length} blocking condition(s) pending: ${titles}`
        )
        error.code = 'E_BLOCKING_CONDITIONS'
        error.blockingConditions = check.blockingConditions
        throw error
      }

      // Required conditions need explicit resolutions
      if (check.requiredPendingConditions.length > 0) {
        const providedResolutions = options?.requiredResolutions || []
        const providedIds = new Set(providedResolutions.map((r) => r.conditionId))
        const missingResolutions = check.requiredPendingConditions.filter(
          (c) => !providedIds.has(c.id)
        )

        if (missingResolutions.length > 0) {
          const titles = missingResolutions.map((c) => c.getLabel('fr')).join(', ')
          const error: any = new Error(
            `Cannot advance: ${missingResolutions.length} required condition(s) need explicit resolution: ${titles}`
          )
          error.code = 'E_REQUIRED_RESOLUTIONS_NEEDED'
          error.requiredConditions = missingResolutions
          throw error
        }
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

    // Find the next step
    const nextStep = transaction.transactionSteps.find(
      (s) => s.stepOrder === currentStep.stepOrder + 1
    )

    const nextStepOrder = nextStep ? nextStep.stepOrder : currentStepOrder + 1

    // D4: Archive conditions from current step
    try {
      await ConditionsEngineService.archiveConditionsOnStepChange(
        transactionId,
        currentStepOrder,
        nextStepOrder,
        userId,
        options?.requiredResolutions
      )
    } catch (archiveError) {
      logger.error({ transactionId, archiveError }, 'Failed to archive conditions on step change')
      throw archiveError
    }

    await ActivityFeedService.log({
      transactionId,
      userId,
      activityType: 'step_completed',
      metadata: {
        stepName: currentWfStep.name,
        stepOrder: currentStep.stepOrder,
      },
    })

    // Save optional note attached to step validation
    if (options?.note?.trim()) {
      await Note.create({
        transactionId,
        authorUserId: userId,
        content: options.note.trim(),
      })
    }

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

    // Create conditions only if autoConditionsEnabled
    if (transaction.autoConditionsEnabled) {
      // D27: Check if profile exists to decide which condition system to use
      const profile = await TransactionProfile.find(transactionId)

      if (profile) {
        // Premium: Create conditions from templates based on profile
        try {
          await ConditionsEngineService.createConditionsFromProfile(
            transactionId,
            nextStep.id,
            nextStepOrder,
            userId
          )
        } catch (profileError) {
          logger.warn(
            { transactionId, profileError },
            'Failed to create Premium conditions from profile'
          )
        }
      } else {
        // Legacy: Create conditions from workflow step template (no profile)
        await this.createConditionsFromTemplate(transactionId, nextStep.id, nextWfStep)
      }
    }

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

    // Create conditions only if autoConditionsEnabled
    if (transaction.autoConditionsEnabled) {
      const profile = await TransactionProfile.find(transactionId)

      if (profile) {
        try {
          await ConditionsEngineService.createConditionsFromProfile(
            transactionId,
            nextStep.id,
            nextStep.stepOrder,
            userId
          )
        } catch (profileError) {
          logger.warn(
            { transactionId, profileError },
            'Failed to create Premium conditions from profile on skip'
          )
        }
      } else {
        await this.createConditionsFromTemplate(transactionId, nextStep.id, nextWfStep)
      }
    }

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
   * Now uses Premium 'level' field with fallback to legacy 'isBlocking'
   */
  static async checkBlockingConditions(transactionStepId: number): Promise<Condition[]> {
    return Condition.query()
      .where('transactionStepId', transactionStepId)
      .where('status', 'pending')
      .where((query) => {
        query.where('level', 'blocking').orWhere('isBlocking', true)
      })
  }

  /**
   * Return conditions that need resolution before step advancement.
   * D4: Returns both blocking and required pending conditions.
   */
  static async getConditionsNeedingResolution(transactionId: number, stepOrder: number) {
    return ConditionsEngineService.checkStepAdvancement(transactionId, stepOrder)
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
        level: tplCond.isBlockingDefault ? 'blocking' : 'recommended',
        isBlocking: tplCond.isBlockingDefault,
        status: 'pending',
        dueDate,
      })
    }
  }

  /**
   * Execute or schedule automations for a given trigger type.
   * Dispatches each matching automation through AutomationExecutorService.
   * If automation has delayDays > 0, it gets scheduled via BullMQ queue.
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
        await AutomationExecutorService.scheduleOrExecute(automation, transactionId, {
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
