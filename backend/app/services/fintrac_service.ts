import Transaction from '#models/transaction'
import TransactionParty from '#models/transaction_party'
import TransactionStep from '#models/transaction_step'
import WorkflowStep from '#models/workflow_step'
import Condition from '#models/condition'
import FintracRecord from '#models/fintrac_record'
import ConditionEvent from '#models/condition_event'
import { ActivityFeedService } from '#services/activity_feed_service'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'

/**
 * FintracService — FINTRAC compliance management
 *
 * Creates blocking conditions for identity verification at firm-pending step.
 * Only active when autoConditionsEnabled = true on the transaction.
 *
 * Rules:
 * - purchase → FINTRAC for each buyer party
 * - sale → FINTRAC for each seller party
 * - 1 condition per applicable party
 * - blocking level, no escape/skip possible
 * - Triggered at firm-pending step entry + on party add/remove
 */
export class FintracService {
  private static readonly FINTRAC_STEP_SLUG = 'firm-pending'
  private static readonly FINTRAC_TITLE_PREFIX = 'FINTRAC'

  /**
   * Get the role that requires FINTRAC verification based on transaction type
   */
  private static getTargetRole(transactionType: 'purchase' | 'sale'): 'buyer' | 'seller' {
    return transactionType === 'purchase' ? 'buyer' : 'seller'
  }

  /**
   * Build the condition title for a party
   */
  private static buildConditionTitle(partyName: string): string {
    return `${this.FINTRAC_TITLE_PREFIX} — ${partyName}`
  }

  /**
   * Build bilingual labels for the condition
   */
  private static buildLabels(partyName: string) {
    return {
      labelFr: `Conformité FINTRAC — Vérification d'identité de ${partyName}`,
      labelEn: `FINTRAC Compliance — Identity verification for ${partyName}`,
    }
  }

  /**
   * Check if a step is the FINTRAC trigger step (firm-pending)
   */
  private static async isFintracStep(workflowStepId: number): Promise<boolean> {
    const wfStep = await WorkflowStep.find(workflowStepId)
    return wfStep?.slug === this.FINTRAC_STEP_SLUG
  }

  /**
   * Check if a transaction is at or past the firm-pending step
   */
  static async isAtOrPastFirmPending(transaction: Transaction): Promise<boolean> {
    if (!transaction.currentStepId) return false

    const currentStep = await TransactionStep.find(transaction.currentStepId)
    if (!currentStep) return false

    // Find the firm-pending step order
    const steps = await TransactionStep.query()
      .where('transactionId', transaction.id)
      .orderBy('stepOrder', 'asc')

    for (const step of steps) {
      const isFintrac = await this.isFintracStep(step.workflowStepId)
      if (isFintrac) {
        return currentStep.stepOrder >= step.stepOrder
      }
    }

    return false
  }

  /**
   * Called when a transaction enters a new step.
   * Creates FINTRAC conditions if the step is firm-pending and autoConditionsEnabled is true.
   */
  static async onStepEnter(
    transaction: Transaction,
    step: TransactionStep,
    userId: number
  ): Promise<void> {
    logger.info(
      { transactionId: transaction.id, stepOrder: step.stepOrder, workflowStepId: step.workflowStepId, autoConditionsEnabled: transaction.autoConditionsEnabled },
      'FINTRAC onStepEnter called'
    )

    const isFintrac = await this.isFintracStep(step.workflowStepId)
    if (!isFintrac) {
      logger.debug(
        { transactionId: transaction.id, workflowStepId: step.workflowStepId },
        'FINTRAC: step is not firm-pending, skipping'
      )
      return
    }

    if (!transaction.autoConditionsEnabled) {
      logger.info(
        { transactionId: transaction.id },
        'FINTRAC creation skipped — autoConditionsEnabled is false'
      )
      return
    }

    const targetRole = this.getTargetRole(transaction.type)
    const parties = await TransactionParty.query()
      .where('transactionId', transaction.id)
      .where('role', targetRole)

    if (parties.length === 0) {
      logger.info(
        { transactionId: transaction.id, targetRole },
        'No parties found for FINTRAC at firm-pending — conditions will be created when parties are added'
      )
      return
    }

    for (const party of parties) {
      await this.createFintracConditionForParty(transaction, step, party, userId)
    }
  }

  /**
   * Called when a party is added to a transaction.
   * If the transaction is at/past firm-pending, auto-creates a FINTRAC condition.
   */
  static async onPartyAdded(
    transaction: Transaction,
    party: TransactionParty,
    userId: number
  ): Promise<void> {
    const targetRole = this.getTargetRole(transaction.type)
    if (party.role !== targetRole) return

    if (!transaction.autoConditionsEnabled) {
      logger.info(
        { transactionId: transaction.id, partyId: party.id },
        'FINTRAC creation skipped on party add — autoConditionsEnabled is false'
      )
      return
    }

    const atOrPast = await this.isAtOrPastFirmPending(transaction)
    if (!atOrPast) return

    // Find the firm-pending step for this transaction
    const firmPendingStep = await this.findFirmPendingStep(transaction.id)
    if (!firmPendingStep) return

    await this.createFintracConditionForParty(transaction, firmPendingStep, party, userId)
  }

  /**
   * Called when a party is removed from a transaction.
   * Archives any associated FINTRAC condition and soft-deletes the FintracRecord.
   */
  static async onPartyRemoved(
    transaction: Transaction,
    party: TransactionParty,
    userId: number
  ): Promise<void> {
    // Find and archive the FINTRAC condition for this party
    const conditionTitle = this.buildConditionTitle(party.fullName)
    const condition = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', conditionTitle)
      .where('archived', false)
      .first()

    if (condition) {
      const firmPendingStep = await this.findFirmPendingStep(transaction.id)
      await condition.archive(firmPendingStep?.stepOrder ?? 0)

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId,
        activityType: 'condition_created',
        metadata: {
          action: 'fintrac_archived',
          partyName: party.fullName,
          conditionId: condition.id,
        },
      })
    }

    // Delete the FintracRecord
    const record = await FintracRecord.query()
      .where('transactionId', transaction.id)
      .where('partyId', party.id)
      .first()

    if (record) {
      await record.delete()
    }
  }

  /**
   * Check if all FINTRAC conditions are resolved for a transaction
   */
  static async isCompliant(transactionId: number): Promise<boolean> {
    const pendingFintrac = await Condition.query()
      .where('transactionId', transactionId)
      .where('title', 'like', `${this.FINTRAC_TITLE_PREFIX} —%`)
      .where('status', 'pending')
      .where('archived', false)

    return pendingFintrac.length === 0
  }

  /**
   * Get all FINTRAC records for a transaction
   */
  static async getRecords(transactionId: number): Promise<FintracRecord[]> {
    return FintracRecord.query()
      .where('transactionId', transactionId)
      .preload('party')
      .preload('verifiedBy')
      .orderBy('createdAt', 'asc')
  }

  /**
   * Complete a FINTRAC record with identity data
   */
  static async complete(
    fintracRecordId: number,
    data: {
      dateOfBirth: Date | string
      idType: string
      idNumber: string
      occupation?: string
      sourceOfFunds?: string
      notes?: string
    },
    userId: number
  ): Promise<FintracRecord> {
    const record = await FintracRecord.findOrFail(fintracRecordId)

    const dob = data.dateOfBirth instanceof Date
      ? DateTime.fromJSDate(data.dateOfBirth)
      : DateTime.fromISO(data.dateOfBirth)

    record.merge({
      dateOfBirth: dob,
      idType: data.idType as any,
      idNumber: data.idNumber,
      occupation: data.occupation || null,
      sourceOfFunds: data.sourceOfFunds || null,
      notes: data.notes || null,
      verifiedAt: DateTime.now(),
      verifiedByUserId: userId,
    })
    await record.save()

    return record
  }

  /**
   * Auto-resolve the FINTRAC condition for a party (called after record completion + evidence upload)
   */
  static async resolveConditionForParty(
    transactionId: number,
    partyId: number,
    userId: number
  ): Promise<void> {
    // Find the party to get the name
    const party = await TransactionParty.findOrFail(partyId)
    const conditionTitle = this.buildConditionTitle(party.fullName)

    const condition = await Condition.query()
      .where('transactionId', transactionId)
      .where('title', conditionTitle)
      .where('archived', false)
      .where('status', 'pending')
      .first()

    if (!condition) {
      logger.warn({ transactionId, partyId }, 'No pending FINTRAC condition found to resolve')
      return
    }

    // Check that at least 1 identity evidence exists
    const evidenceCount = await condition.related('evidence').query().count('* as total')
    const total = Number(evidenceCount[0]?.$extras?.total ?? 0)

    if (total === 0) {
      logger.warn({ conditionId: condition.id }, 'Cannot auto-resolve FINTRAC: no evidence attached')
      return
    }

    // Resolve the condition
    await condition.resolve('completed', userId, {
      resolutionType: 'completed',
      note: 'FINTRAC identity verification completed',
      hasEvidence: true,
    })

    await ActivityFeedService.log({
      transactionId,
      userId,
      activityType: 'condition_completed',
      metadata: {
        conditionTitle: condition.title,
        conditionId: condition.id,
        fintracCompliance: true,
      },
    })
  }

  // --- Private helpers ---

  /**
   * Create a FINTRAC condition + empty FintracRecord for a party
   */
  private static async createFintracConditionForParty(
    transaction: Transaction,
    step: TransactionStep,
    party: TransactionParty,
    userId: number
  ): Promise<void> {
    const conditionTitle = this.buildConditionTitle(party.fullName)

    // Anti-duplicate check
    const existing = await Condition.query()
      .where('transactionId', transaction.id)
      .where('title', conditionTitle)
      .where('archived', false)
      .first()

    if (existing) {
      logger.info(
        { transactionId: transaction.id, partyId: party.id },
        'FINTRAC condition already exists for this party — skipping'
      )
      return
    }

    const labels = this.buildLabels(party.fullName)

    // Create blocking condition
    const condition = await Condition.create({
      transactionId: transaction.id,
      transactionStepId: step.id,
      title: conditionTitle,
      description: labels.labelFr,
      labelFr: labels.labelFr,
      labelEn: labels.labelEn,
      status: 'pending',
      type: 'legal',
      priority: 'high',
      level: 'blocking',
      sourceType: 'legal',
      isBlocking: true,
      stepWhenCreated: step.stepOrder,
    })

    // Log condition event
    await ConditionEvent.log(condition.id, 'created', userId, {
      fintrac: true,
      partyId: party.id,
      partyName: party.fullName,
    })

    // Create empty FintracRecord
    await FintracRecord.create({
      transactionId: transaction.id,
      partyId: party.id,
    })

    await ActivityFeedService.log({
      transactionId: transaction.id,
      userId,
      activityType: 'condition_created',
      metadata: {
        conditionTitle: condition.title,
        conditionId: condition.id,
        fintracCompliance: true,
        partyName: party.fullName,
      },
    })

    logger.info(
      { transactionId: transaction.id, partyId: party.id, conditionId: condition.id },
      'FINTRAC condition created for party'
    )
  }

  /**
   * Find the firm-pending TransactionStep for a transaction
   */
  private static async findFirmPendingStep(transactionId: number): Promise<TransactionStep | null> {
    const steps = await TransactionStep.query()
      .where('transactionId', transactionId)
      .preload('workflowStep')
      .orderBy('stepOrder', 'asc')

    for (const step of steps) {
      if (step.workflowStep?.slug === this.FINTRAC_STEP_SLUG) {
        return step
      }
    }
    return null
  }
}
