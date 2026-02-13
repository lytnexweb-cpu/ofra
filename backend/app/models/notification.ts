import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Transaction from './transaction.js'

export type NotificationType =
  | 'deadline_warning'
  | 'condition_overdue'
  | 'condition_resolved'
  | 'blocking_alert'
  | 'step_advanced'
  | 'offer_update'
  | 'email_sent'
  | 'member_invited'
  | 'party_added'
  | 'transaction_cancelled'
  | 'share_sent'
  | 'daily_digest'

export type NotificationSeverity = 'info' | 'warning' | 'urgent'

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare transactionId: number | null

  @column()
  declare type: string

  @column()
  declare title: string

  @column()
  declare body: string | null

  @column()
  declare icon: string | null

  @column()
  declare severity: NotificationSeverity

  @column()
  declare link: string | null

  @column()
  declare emailRecipients: string[] | null

  @column.dateTime()
  declare readAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>
}
