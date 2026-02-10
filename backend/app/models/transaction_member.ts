import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction from './transaction.js'
import User from './user.js'

export type MemberRole = 'viewer' | 'editor' | 'admin'
export type MemberStatus = 'pending' | 'active' | 'revoked'

export default class TransactionMember extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

  @column()
  declare userId: number | null

  @column()
  declare email: string | null

  @column()
  declare role: MemberRole

  @column()
  declare status: MemberStatus

  @column()
  declare invitedBy: number | null

  @column.dateTime({ columnName: 'invited_at' })
  declare invitedAt: DateTime | null

  @column.dateTime({ columnName: 'accepted_at' })
  declare acceptedAt: DateTime | null

  @column.dateTime({ columnName: 'revoked_at' })
  declare revokedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'invitedBy', localKey: 'id' })
  declare inviter: BelongsTo<typeof User>
}
