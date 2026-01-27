import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import WorkflowTemplate from './workflow_template.js'
import WorkflowStepCondition from './workflow_step_condition.js'
import WorkflowStepAutomation from './workflow_step_automation.js'

export default class WorkflowStep extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare templateId: number

  @column()
  declare stepOrder: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare typicalDurationDays: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => WorkflowTemplate, { foreignKey: 'templateId' })
  declare template: BelongsTo<typeof WorkflowTemplate>

  @hasMany(() => WorkflowStepCondition, { foreignKey: 'stepId' })
  declare conditions: HasMany<typeof WorkflowStepCondition>

  @hasMany(() => WorkflowStepAutomation, { foreignKey: 'stepId' })
  declare automations: HasMany<typeof WorkflowStepAutomation>
}
