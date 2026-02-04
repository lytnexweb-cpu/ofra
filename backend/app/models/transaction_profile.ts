import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction from './transaction.js'

export type PropertyType = 'house' | 'condo' | 'land'
export type PropertyContext = 'urban' | 'suburban' | 'rural'
export type AccessType = 'public' | 'private' | 'right_of_way'

/**
 * TransactionProfile Model
 *
 * Profil de transaction (8 champs v1) - 1 row par transaction
 * Part of Conditions Engine Premium (D1, D27)
 */
export default class TransactionProfile extends BaseModel {
  @column({ isPrimary: true })
  declare transactionId: number

  // Champs obligatoires (création)
  @column()
  declare propertyType: PropertyType

  @column()
  declare propertyContext: PropertyContext

  @column()
  declare isFinanced: boolean

  // Champs conditionnels (rural)
  @column()
  declare hasWell: boolean | null

  @column()
  declare hasSeptic: boolean | null

  @column()
  declare accessType: AccessType | null

  // Champs conditionnels (condo)
  @column()
  declare condoDocsRequired: boolean | null

  // Champs conditionnels (financé)
  @column()
  declare appraisalRequired: boolean | null

  // Audit
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>

  /**
   * Check if profile is rural
   */
  get isRural(): boolean {
    return this.propertyContext === 'rural'
  }

  /**
   * Check if profile is condo
   */
  get isCondo(): boolean {
    return this.propertyType === 'condo'
  }

  /**
   * Convert to a flat object for template matching
   */
  toMatchObject(): Record<string, any> {
    return {
      property_type: this.propertyType,
      property_context: this.propertyContext,
      is_financed: this.isFinanced,
      has_well: this.hasWell,
      has_septic: this.hasSeptic,
      access_type: this.accessType,
      condo_docs_required: this.condoDocsRequired,
      appraisal_required: this.appraisalRequired,
    }
  }
}
