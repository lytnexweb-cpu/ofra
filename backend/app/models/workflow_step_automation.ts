import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import WorkflowStep from './workflow_step.js'

export type AutomationTrigger = 'on_enter' | 'on_exit' | 'on_condition_complete'

export default class WorkflowStepAutomation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare stepId: number

  @column()
  declare trigger: AutomationTrigger

  @column()
  declare actionType: string

  @column()
  declare delayDays: number

  @column()
  declare templateRef: string | null

  @column()
  declare config: Record<string, any>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => WorkflowStep, { foreignKey: 'stepId' })
  declare step: BelongsTo<typeof WorkflowStep>
}
