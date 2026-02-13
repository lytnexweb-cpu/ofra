import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction from './transaction.js'
import TransactionParty from './transaction_party.js'
import User from './user.js'

export type FintracIdType =
  | 'drivers_license'
  | 'canadian_passport'
  | 'foreign_passport'
  | 'citizenship_card'
  | 'other_government_id'

export default class FintracRecord extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

  @column()
  declare partyId: number

  @column.date()
  declare dateOfBirth: DateTime | null

  @column()
  declare idType: FintracIdType | null

  @column()
  declare idNumber: string | null

  @column()
  declare occupation: string | null

  @column()
  declare sourceOfFunds: string | null

  @column.dateTime()
  declare verifiedAt: DateTime | null

  @column()
  declare verifiedByUserId: number | null

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => TransactionParty, { foreignKey: 'partyId' })
  declare party: BelongsTo<typeof TransactionParty>

  @belongsTo(() => User, { foreignKey: 'verifiedByUserId' })
  declare verifiedBy: BelongsTo<typeof User>

  /**
   * Check if this record is complete (all required fields filled)
   */
  get isComplete(): boolean {
    return !!(this.dateOfBirth && this.idType && this.idNumber && this.verifiedAt)
  }
}
