import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Condition from './condition.js'

export type ConditionLevel = 'blocking' | 'required' | 'recommended'
export type SourceType = 'legal' | 'government' | 'industry' | 'best_practice'
export type PackType = 'rural_nb' | 'condo_nb' | 'finance_nb' | 'inspection_nb' | 'cash_nb' | 'universal' | null
export type DeadlineReference = 'acceptance' | 'closing' | 'step_start'

/**
 * ConditionTemplate Model
 *
 * Templates de conditions issus des Packs (Rural NB, Condo NB, Financé NB)
 * Part of Conditions Engine Premium (D27)
 */
export default class ConditionTemplate extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  // Contenu bilingue
  @column()
  declare labelFr: string

  @column()
  declare labelEn: string

  @column()
  declare descriptionFr: string | null

  @column()
  declare descriptionEn: string | null

  // Classification
  @column()
  declare level: ConditionLevel

  @column()
  declare sourceType: SourceType

  @column()
  declare category: string | null

  // Applicabilité
  @column()
  declare step: number | null

  @column()
  declare appliesWhen: Record<string, any>

  // Métadonnées
  @column()
  declare pack: PackType

  @column()
  declare order: number

  @column()
  declare isDefault: boolean

  @column()
  declare isActive: boolean

  // D37: Deadline relative
  @column()
  declare deadlineReference: DeadlineReference | null

  @column()
  declare defaultDeadlineDays: number | null

  // Audit
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @hasMany(() => Condition, { foreignKey: 'templateId' })
  declare conditions: HasMany<typeof Condition>

  /**
   * Check if this template applies to a given transaction profile
   */
  appliesTo(profile: Record<string, any>): boolean {
    if (!this.appliesWhen || Object.keys(this.appliesWhen).length === 0) {
      return true // No conditions = applies to all
    }

    for (const [key, value] of Object.entries(this.appliesWhen)) {
      if (profile[key] !== value) {
        return false
      }
    }

    return true
  }

  /**
   * D37: Calculate due date based on template deadline reference
   *
   * @param dates Object containing reference dates
   * @returns Calculated due date or null if no deadline defined
   */
  calculateDueDate(dates: {
    acceptanceDate?: DateTime | null
    closingDate?: DateTime | null
    stepStartDate?: DateTime | null
  }): DateTime | null {
    if (!this.deadlineReference || this.defaultDeadlineDays === null) {
      return null
    }

    let referenceDate: DateTime | null = null

    switch (this.deadlineReference) {
      case 'acceptance':
        referenceDate = dates.acceptanceDate ?? null
        break
      case 'closing':
        referenceDate = dates.closingDate ?? null
        break
      case 'step_start':
        referenceDate = dates.stepStartDate ?? null
        break
    }

    if (!referenceDate) {
      return null
    }

    return referenceDate.plus({ days: this.defaultDeadlineDays })
  }
}
