import Condition, { ConditionLevel, ResolutionType } from '#models/condition'
import ConditionTemplate from '#models/condition_template'
import ConditionEvent from '#models/condition_event'
import TransactionProfile from '#models/transaction_profile'
import Transaction from '#models/transaction'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'

/**
 * Resolution request for a single condition
 */
interface ConditionResolution {
  conditionId: number
  resolutionType: ResolutionType
  note?: string
}

/**
 * Result of step advancement pre-check
 */
interface StepAdvanceCheck {
  canAdvance: boolean
  blockingConditions: Condition[]
  requiredPendingConditions: Condition[]
  recommendedPendingConditions: Condition[]
}

/**
 * Conditions Engine Service (Premium)
 *
 * Implements D4 (Archivage Timeline) and D27 (Data Model)
 * Handles: template matching, condition resolution, step advancement with archiving
 */
export class ConditionsEngineService {
  /**
   * Get applicable condition templates for a transaction profile
   */
  static async getApplicableTemplates(
    profile: TransactionProfile,
    step?: number
  ): Promise<ConditionTemplate[]> {
    const profileData = profile.toMatchObject()

    let query = ConditionTemplate.query()
      .where('isActive', true)
      .where('isDefault', true)
      .orderBy('order', 'asc')

    if (step !== undefined) {
      query = query.where((q) => {
        q.whereNull('step').orWhere('step', step)
      })
    }

    const templates = await query

    // Filter by applies_when rules
    return templates.filter((template) => template.appliesTo(profileData))
  }

  /**
   * Create conditions from templates for a transaction step
   */
  static async createConditionsFromProfile(
    transactionId: number,
    transactionStepId: number,
    stepNumber: number,
    userId: string | number
  ): Promise<Condition[]> {
    const profile = await TransactionProfile.find(transactionId)
    if (!profile) {
      logger.warn({ transactionId }, 'No transaction profile found, skipping template conditions')
      return []
    }

    const templates = await this.getApplicableTemplates(profile, stepNumber)
    const conditions: Condition[] = []

    for (const template of templates) {
      const condition = await Condition.create({
        transactionId,
        transactionStepId,
        templateId: template.id,
        title: template.labelFr, // Legacy field
        labelFr: template.labelFr,
        labelEn: template.labelEn,
        description: template.descriptionFr,
        level: template.level,
        sourceType: template.sourceType,
        status: 'pending',
        type: 'other', // Legacy field
        priority: template.level === 'blocking' ? 'high' : 'medium',
        isBlocking: template.level === 'blocking',
        stepWhenCreated: stepNumber,
        archived: false,
      })

      // Log event
      await ConditionEvent.log(condition.id, 'created', userId, {
        template_id: template.id,
        level: template.level,
        source_type: template.sourceType,
      })

      conditions.push(condition)
    }

    return conditions
  }

  /**
   * Check if step can be advanced (D4 rules)
   */
  static async checkStepAdvancement(
    transactionId: number,
    currentStep: number
  ): Promise<StepAdvanceCheck> {
    const conditions = await Condition.query()
      .where('transactionId', transactionId)
      .where((q) => {
        // Handle legacy conditions with NULL stepWhenCreated
        q.where('stepWhenCreated', currentStep).orWhereNull('stepWhenCreated')
      })
      .where((q) => {
        // Handle legacy conditions with NULL archived (treat as not archived)
        q.where('archived', false).orWhereNull('archived')
      })
      .where('status', 'pending')

    // Handle legacy conditions: if level is NULL, fall back to isBlocking
    const blocking = conditions.filter((c) => c.level === 'blocking' || (c.level === null && c.isBlocking))
    const required = conditions.filter((c) => c.level === 'required')
    const recommended = conditions.filter((c) => c.level === 'recommended' || (c.level === null && !c.isBlocking))

    return {
      canAdvance: blocking.length === 0,
      blockingConditions: blocking,
      requiredPendingConditions: required,
      recommendedPendingConditions: recommended,
    }
  }

  /**
   * Resolve multiple conditions with validation
   */
  static async resolveConditions(
    resolutions: ConditionResolution[],
    resolvedBy: string | number
  ): Promise<void> {
    for (const resolution of resolutions) {
      const condition = await Condition.findOrFail(resolution.conditionId)

      // Validate blocking cannot be skipped
      if (condition.level === 'blocking' && resolution.resolutionType === 'skipped_with_risk') {
        throw new Error(`Blocking condition ${condition.id} cannot be skipped with risk`)
      }

      // Validate note requirement for required conditions
      if (
        condition.level === 'required' &&
        resolution.resolutionType !== 'completed' &&
        !resolution.note
      ) {
        throw new Error(
          `Resolution note is required for required condition ${condition.id} when not completed`
        )
      }

      await condition.resolve(resolution.resolutionType, resolvedBy, resolution.note)
    }
  }

  /**
   * Archive conditions on step change (D4)
   *
   * - Blocking: Must already be resolved (enforced by canAdvance check)
   * - Required: Must be resolved with explicit resolution
   * - Recommended: Auto-resolved as 'not_applicable'
   */
  static async archiveConditionsOnStepChange(
    transactionId: number,
    fromStep: number,
    toStep: number,
    userId: string | number,
    requiredResolutions?: ConditionResolution[]
  ): Promise<void> {
    // Get all conditions from the current step (including legacy with NULL stepWhenCreated)
    const conditions = await Condition.query()
      .where('transactionId', transactionId)
      .where((q) => {
        q.where('stepWhenCreated', fromStep).orWhereNull('stepWhenCreated')
      })
      .where((q) => {
        q.where('archived', false).orWhereNull('archived')
      })

    // Process required resolutions first
    if (requiredResolutions && requiredResolutions.length > 0) {
      await this.resolveConditions(requiredResolutions, userId)
    }

    // Process each condition
    for (const condition of conditions) {
      // Refresh to get updated state
      await condition.refresh()

      // Determine effective level (handle legacy conditions with NULL level)
      const effectiveLevel = condition.level ?? (condition.isBlocking ? 'blocking' : 'recommended')

      // If still pending, handle by level
      if (condition.status === 'pending') {
        if (effectiveLevel === 'blocking') {
          // Should never happen if checkStepAdvancement was called
          const error: any = new Error(`Blocking condition ${condition.id} is still pending`)
          error.code = 'E_BLOCKING_CONDITIONS'
          error.blockingConditions = [condition]
          throw error
        }

        if (effectiveLevel === 'required') {
          // Should have been resolved via requiredResolutions
          const error: any = new Error(`Required condition ${condition.id} must be explicitly resolved`)
          error.code = 'E_REQUIRED_RESOLUTIONS_NEEDED'
          error.requiredConditions = [condition]
          throw error
        }

        if (effectiveLevel === 'recommended') {
          // Auto-resolve as not_applicable
          await condition.resolve('not_applicable', 'system', 'Auto-archived on step change')
        }
      }

      // Set step_when_resolved if resolved but not set
      if (condition.status === 'completed' && !condition.stepWhenResolved) {
        condition.stepWhenResolved = fromStep
        await condition.save()
      }

      // Archive the condition
      await condition.archive(toStep)
    }

    logger.info(
      { transactionId, fromStep, toStep, conditionCount: conditions.length },
      'Archived conditions on step change'
    )
  }

  /**
   * Get conditions grouped by step for Timeline display
   */
  static async getConditionsGroupedByStep(
    transactionId: number
  ): Promise<Map<number, Condition[]>> {
    const conditions = await Condition.query()
      .where('transactionId', transactionId)
      .orderBy('stepWhenCreated', 'asc')
      .orderBy('level', 'desc') // blocking first
      .orderBy('createdAt', 'asc')

    const grouped = new Map<number, Condition[]>()

    for (const condition of conditions) {
      const step = condition.stepWhenCreated || 1
      if (!grouped.has(step)) {
        grouped.set(step, [])
      }
      grouped.get(step)!.push(condition)
    }

    return grouped
  }

  /**
   * Get active (non-archived) conditions for a transaction
   */
  static async getActiveConditions(transactionId: number): Promise<Condition[]> {
    return Condition.query()
      .where('transactionId', transactionId)
      .where('archived', false)
      .orderBy('level', 'desc')
      .orderBy('createdAt', 'asc')
  }

  /**
   * Get audit trail for a condition
   */
  static async getConditionHistory(conditionId: number): Promise<ConditionEvent[]> {
    return ConditionEvent.query()
      .where('conditionId', conditionId)
      .orderBy('createdAt', 'asc')
  }

  /**
   * D39: Load full condition pack for a transaction
   *
   * Creates all applicable conditions for all steps based on transaction profile.
   * Uses D37 deadlines relatives for automatic due date calculation.
   */
  static async loadPackForTransaction(
    transactionId: number,
    userId: string | number,
    dates?: {
      acceptanceDate?: DateTime | null
      closingDate?: DateTime | null
    }
  ): Promise<{ loaded: number; byStep: Record<number, number> }> {
    // Get transaction with steps and profile
    const transaction = await Transaction.query()
      .where('id', transactionId)
      .preload('transactionSteps')
      .firstOrFail()

    const profile = await TransactionProfile.find(transactionId)
    if (!profile) {
      logger.warn({ transactionId }, 'D39: No profile found, cannot load pack')
      return { loaded: 0, byStep: {} }
    }

    const profileData = profile.toMatchObject()

    // Get all applicable templates
    const templates = await ConditionTemplate.query()
      .where('isActive', true)
      .where('isDefault', true)
      .orderBy('step', 'asc')
      .orderBy('order', 'asc')

    const applicableTemplates = templates.filter((t) => t.appliesTo(profileData))

    const byStep: Record<number, number> = {}
    let loaded = 0

    for (const template of applicableTemplates) {
      // Find matching transaction step
      const stepNumber = template.step ?? 1
      const transactionStep = transaction.transactionSteps.find(
        (ts) => ts.stepOrder === stepNumber
      )

      if (!transactionStep) {
        logger.warn(
          { transactionId, templateId: template.id, step: stepNumber },
          'D39: No transaction step found for template'
        )
        continue
      }

      // D37: Calculate due date from template
      let dueDate: DateTime | null = null
      if (template.deadlineReference && template.defaultDeadlineDays !== null) {
        const stepStartDate = transactionStep.enteredAt
          ? DateTime.fromJSDate(new Date(transactionStep.enteredAt.toString()))
          : null

        dueDate = template.calculateDueDate({
          acceptanceDate: dates?.acceptanceDate ?? null,
          closingDate: dates?.closingDate ?? null,
          stepStartDate,
        })
      }

      // Create condition
      const condition = await Condition.create({
        transactionId,
        transactionStepId: transactionStep.id,
        templateId: template.id,
        title: template.labelFr,
        labelFr: template.labelFr,
        labelEn: template.labelEn,
        description: template.descriptionFr,
        level: template.level,
        sourceType: template.sourceType,
        status: 'pending',
        type: 'other',
        priority: template.level === 'blocking' ? 'high' : 'medium',
        isBlocking: template.level === 'blocking',
        stepWhenCreated: stepNumber,
        dueDate,
        archived: false,
      })

      // Log event
      await ConditionEvent.log(condition.id, 'created', userId, {
        template_id: template.id,
        level: template.level,
        source_type: template.sourceType,
        pack_load: true,
        due_date: dueDate?.toISO() ?? null,
      })

      loaded++
      byStep[stepNumber] = (byStep[stepNumber] ?? 0) + 1
    }

    logger.info(
      { transactionId, loaded, byStep },
      'D39: Condition pack loaded'
    )

    return { loaded, byStep }
  }

  /**
   * Create a custom condition (not from template)
   */
  static async createCustomCondition(params: {
    transactionId: number
    transactionStepId: number
    labelFr: string
    labelEn: string
    level: ConditionLevel
    description?: string
    dueDate?: DateTime
    userId: string | number
    stepNumber: number
  }): Promise<Condition> {
    const condition = await Condition.create({
      transactionId: params.transactionId,
      transactionStepId: params.transactionStepId,
      templateId: null,
      title: params.labelFr,
      labelFr: params.labelFr,
      labelEn: params.labelEn,
      description: params.description || null,
      level: params.level,
      sourceType: 'best_practice',
      status: 'pending',
      type: 'other',
      priority: params.level === 'blocking' ? 'high' : 'medium',
      isBlocking: params.level === 'blocking',
      stepWhenCreated: params.stepNumber,
      dueDate: params.dueDate || null,
      archived: false,
    })

    await ConditionEvent.log(condition.id, 'created', params.userId, {
      custom: true,
      level: params.level,
    })

    return condition
  }
}
