import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class WaitlistEmail extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column()
  declare source: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
