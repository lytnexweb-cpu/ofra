import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction, { type TransactionStatus } from './transaction.js'

export type ConditionStatus = 'pending' | 'completed'
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
export type ConditionStage = TransactionStatus

export default class Condition extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

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

  @column()
  declare stage: ConditionStage

  @column({ columnName: 'is_blocking' })
  declare isBlocking: boolean

  @column({ columnName: 'document_url' })
  declare documentUrl: string | null

  @column({ columnName: 'document_label' })
  declare documentLabel: string | null

  @column.date()
  declare dueDate: DateTime | null

  @column.dateTime()
  declare completedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>
}
