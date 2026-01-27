import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Organization from './organization.js'
import WorkflowStep from './workflow_step.js'

export type TransactionType = 'purchase' | 'sale'

export default class WorkflowTemplate extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare provinceCode: string

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare transactionType: TransactionType

  @column()
  declare isDefault: boolean

  @column()
  declare isActive: boolean

  @column()
  declare createdByUserId: number | null

  @column()
  declare organizationId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare createdBy: BelongsTo<typeof User>

  @belongsTo(() => Organization, { foreignKey: 'organizationId' })
  declare organization: BelongsTo<typeof Organization>

  @hasMany(() => WorkflowStep, { foreignKey: 'templateId' })
  declare steps: HasMany<typeof WorkflowStep>
}
