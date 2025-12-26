import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction from './transaction.js'
import User from './user.js'

export default class Note extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

  @column()
  declare authorUserId: number

  @column()
  declare content: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => User, { foreignKey: 'authorUserId' })
  declare author: BelongsTo<typeof User>
}
