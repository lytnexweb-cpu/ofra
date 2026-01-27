import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import WorkflowStep from './workflow_step.js'

export type ConditionPriority = 'low' | 'medium' | 'high'

export default class WorkflowStepCondition extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare stepId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare conditionType: string

  @column()
  declare priority: ConditionPriority

  @column()
  declare isBlockingDefault: boolean

  @column()
  declare isRequired: boolean

  @column()
  declare dependsOnStepId: number | null

  @column()
  declare dueDateOffsetDays: number | null

  @column()
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => WorkflowStep, { foreignKey: 'stepId' })
  declare step: BelongsTo<typeof WorkflowStep>
}
