import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction, { type TransactionStatus } from './transaction.js'
import User from './user.js'

export default class TransactionStatusHistory extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

  @column()
  declare changedByUserId: number

  @column()
  declare fromStatus: TransactionStatus | null

  @column()
  declare toStatus: TransactionStatus

  @column()
  declare note: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => User, { foreignKey: 'changedByUserId' })
  declare changedBy: BelongsTo<typeof User>
}
