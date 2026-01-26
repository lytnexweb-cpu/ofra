import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { ConditionType, ConditionPriority, ConditionStage } from './condition.js'
import TransactionTemplate from './transaction_template.js'

export default class TemplateCondition extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare templateId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare type: ConditionType

  @column()
  declare priority: ConditionPriority

  @column()
  declare stage: ConditionStage

  @column({ columnName: 'is_blocking' })
  declare isBlocking: boolean

  @column({ columnName: 'due_date_offset_days' })
  declare dueDateOffsetDays: number

  @column({ columnName: 'sort_order' })
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => TransactionTemplate, { foreignKey: 'templateId' })
  declare template: BelongsTo<typeof TransactionTemplate>
}
