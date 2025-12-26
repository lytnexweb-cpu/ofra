import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction from './transaction.js'

export type ConditionStatus = 'pending' | 'completed'
export type ConditionType =
  | 'inspection'
  | 'financing'
  | 'appraisal'
  | 'legal'
  | 'documents'
  | 'repairs'
  | 'other'
export type ConditionPriority = 'low' | 'medium' | 'high'

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
