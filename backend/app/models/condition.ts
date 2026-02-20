import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Transaction from './transaction.js'
import Offer from './offer.js'
import TransactionStep from './transaction_step.js'
import ConditionTemplate from './condition_template.js'
import ConditionEvidence from './condition_evidence.js'
import ConditionEvent from './condition_event.js'
import ProfessionalContact from './professional_contact.js'

// Legacy types (kept for backwards compatibility)
export type ConditionStatus = 'pending' | 'in_progress' | 'completed'
export type ConditionType =
  | 'financing'
  | 'deposit'
  | 'inspection'
  | 'water_test'
  | 'rpds_review'
  | 'appraisal'
  | 'legal'
  | 'documents'
  | 'repairs'
  | 'other'
export type ConditionPriority = 'low' | 'medium' | 'high'

// Premium types (D27)
export type ConditionLevel = 'blocking' | 'required' | 'recommended'
export type SourceType = 'legal' | 'government' | 'industry' | 'best_practice'
export type ResolutionType = 'completed' | 'waived' | 'not_applicable' | 'skipped_with_risk'

// D41: Resolution options for graduated friction
export interface ResolveOptions {
  resolutionType: ResolutionType
  note?: string
  // Evidence tracking
  hasEvidence?: boolean
  evidenceId?: number | null
  evidenceFilename?: string | null
  // Escape without proof (blocking only)
  escapedWithoutProof?: boolean
  escapeReason?: string
}

/**
 * Condition Model
 *
 * Enhanced for Conditions Engine Premium (D27)
 * Now supports: levels, resolution types, archiving, audit trail
 */
export default class Condition extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

  @column()
  declare transactionStepId: number | null

  @column()
  declare offerId: number | null

  // Link to template (nullable if custom condition)
  @column()
  declare templateId: number | null

  // Legacy fields
  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare status: ConditionStatus

  @column()
  declare type: ConditionType

  @column()
  declare priority: ConditionPriority

  @column({ columnName: 'is_blocking' })
  declare isBlocking: boolean

  @column({ columnName: 'document_url' })
  declare documentUrl: string | null

  @column({ columnName: 'document_label' })
  declare documentLabel: string | null

  // Premium: Bilingual labels (snapshot from template)
  @column()
  declare labelFr: string | null

  @column()
  declare labelEn: string | null

  // Premium: Level and source
  @column()
  declare level: ConditionLevel

  @column()
  declare sourceType: SourceType | null

  // Premium: Resolution
  @column()
  declare resolutionType: ResolutionType | null

  @column()
  declare resolutionNote: string | null

  @column.dateTime()
  declare resolvedAt: DateTime | null

  @column()
  declare resolvedBy: string | null

  // Premium: Archiving
  @column()
  declare archived: boolean

  @column.dateTime()
  declare archivedAt: DateTime | null

  @column()
  declare archivedStep: number | null

  // Premium: Step tracking
  @column()
  declare stepWhenCreated: number | null

  @column()
  declare stepWhenResolved: number | null

  // D41: Escape tracking (completed without proof)
  @column()
  declare escapedWithoutProof: boolean

  @column()
  declare escapeReason: string | null

  @column.dateTime()
  declare escapeConfirmedAt: DateTime | null

  // C12: Assigned professional contact
  @column()
  declare assignedProId: number | null

  // Dates
  @column.date()
  declare dueDate: DateTime | null

  @column.dateTime()
  declare completedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => TransactionStep, { foreignKey: 'transactionStepId' })
  declare transactionStep: BelongsTo<typeof TransactionStep>

  @belongsTo(() => Offer, { foreignKey: 'offerId' })
  declare offer: BelongsTo<typeof Offer>

  @belongsTo(() => ConditionTemplate, { foreignKey: 'templateId' })
  declare template: BelongsTo<typeof ConditionTemplate>

  @belongsTo(() => ProfessionalContact, { foreignKey: 'assignedProId' })
  declare assignedPro: BelongsTo<typeof ProfessionalContact>

  @hasMany(() => ConditionEvidence, { foreignKey: 'conditionId' })
  declare evidence: HasMany<typeof ConditionEvidence>

  @hasMany(() => ConditionEvent, { foreignKey: 'conditionId' })
  declare events: HasMany<typeof ConditionEvent>

  /**
   * Get the display label based on locale
   */
  getLabel(locale: 'fr' | 'en' = 'fr'): string {
    if (locale === 'en' && this.labelEn) {
      return this.labelEn
    }
    return this.labelFr || this.title
  }

  /**
   * Check if this condition can be skipped (not blocking)
   */
  get canBeSkipped(): boolean {
    return this.level !== 'blocking'
  }

  /**
   * Check if resolution note is required
   */
  requiresResolutionNote(resolutionType: ResolutionType): boolean {
    if (this.level !== 'required') return false
    return resolutionType !== 'completed'
  }

  /**
   * Resolve the condition with D41 graduated friction support
   */
  async resolve(
    resolutionType: ResolutionType,
    resolvedBy: string | number,
    noteOrOptions?: string | ResolveOptions
  ): Promise<void> {
    // Handle both legacy (string note) and new (options object) signatures
    const options: ResolveOptions = typeof noteOrOptions === 'string'
      ? { resolutionType, note: noteOrOptions }
      : noteOrOptions || { resolutionType }

    const { note, hasEvidence, evidenceId, evidenceFilename, escapedWithoutProof, escapeReason } = options

    // Validate blocking cannot be skipped_with_risk
    if (this.level === 'blocking' && resolutionType === 'skipped_with_risk') {
      throw new Error('Blocking conditions cannot be skipped with risk')
    }

    // D41: Validate escape requirements for blocking conditions
    if (this.level === 'blocking' && escapedWithoutProof) {
      if (!escapeReason || escapeReason.trim().length < 10) {
        throw new Error('Escape reason must be at least 10 characters for blocking conditions')
      }
    }

    // Validate note requirement for required conditions
    if (this.requiresResolutionNote(resolutionType) && !note) {
      throw new Error('Resolution note is required for this condition')
    }

    this.status = 'completed'
    this.resolutionType = resolutionType
    this.resolutionNote = note || null
    this.resolvedAt = DateTime.now()
    this.resolvedBy = String(resolvedBy)
    this.completedAt = DateTime.now()

    // D41: Track escape
    if (escapedWithoutProof) {
      this.escapedWithoutProof = true
      this.escapeReason = escapeReason || null
      this.escapeConfirmedAt = DateTime.now()
    }

    await this.save()

    // Log event with D41 metadata
    await ConditionEvent.log(this.id, 'resolved', resolvedBy, {
      resolution_type: resolutionType,
      resolution_note: note,
      // D41: Evidence and escape tracking
      has_evidence: hasEvidence ?? false,
      evidence_id: evidenceId ?? null,
      evidence_filename: evidenceFilename ?? null,
      escaped_without_proof: escapedWithoutProof ?? false,
      escape_reason: escapeReason ?? null,
    })
  }

  /**
   * Archive the condition (called on step change)
   */
  async archive(archivedStep: number): Promise<void> {
    this.archived = true
    this.archivedAt = DateTime.now()
    this.archivedStep = archivedStep

    await this.save()

    // Log event
    await ConditionEvent.log(this.id, 'archived', 'system', {
      archived_step: archivedStep,
    })
  }
}
