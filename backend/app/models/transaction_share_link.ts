import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction from './transaction.js'
import User from './user.js'

export type ShareLinkRole = 'viewer' | 'editor'

export default class TransactionShareLink extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

  @column()
  declare token: string

  @column()
  declare role: ShareLinkRole

  @column()
  declare isActive: boolean

  @column.dateTime({ columnName: 'expires_at' })
  declare expiresAt: DateTime | null

  @column({ serializeAs: null })
  declare passwordHash: string | null

  @column()
  declare createdBy: number

  @column.dateTime({ columnName: 'last_accessed_at' })
  declare lastAccessedAt: DateTime | null

  @column()
  declare accessCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>
}
