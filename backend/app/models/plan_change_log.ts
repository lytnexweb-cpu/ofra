import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Plan from './plan.js'
import User from './user.js'

export default class PlanChangeLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare planId: number

  @column()
  declare adminId: number

  @column()
  declare fieldChanged: string

  @column()
  declare oldValue: string | null

  @column()
  declare newValue: string | null

  @column()
  declare reason: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Plan)
  declare plan: BelongsTo<typeof Plan>

  @belongsTo(() => User, { foreignKey: 'adminId' })
  declare admin: BelongsTo<typeof User>
}
