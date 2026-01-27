import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Transaction from './transaction.js'
import WorkflowStep from './workflow_step.js'
import Condition from './condition.js'

export type TransactionStepStatus = 'pending' | 'active' | 'completed' | 'skipped'

export default class TransactionStep extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

  @column()
  declare workflowStepId: number

  @column()
  declare stepOrder: number

  @column()
  declare status: TransactionStepStatus

  @column.dateTime()
  declare enteredAt: DateTime | null

  @column.dateTime()
  declare completedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => WorkflowStep, { foreignKey: 'workflowStepId' })
  declare workflowStep: BelongsTo<typeof WorkflowStep>

  @hasMany(() => Condition, { foreignKey: 'transactionStepId' })
  declare conditions: HasMany<typeof Condition>
}
