import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import PlanChangeLog from './plan_change_log.js'

export default class Plan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare monthlyPrice: number

  @column()
  declare annualPrice: number

  @column()
  declare maxTransactions: number | null // null = unlimited

  @column()
  declare maxStorageGb: number

  @column()
  declare maxUsers: number

  @column()
  declare historyMonths: number | null // null = unlimited

  @column()
  declare isActive: boolean

  @column()
  declare displayOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => PlanChangeLog)
  declare changeLogs: HasMany<typeof PlanChangeLog>
}
