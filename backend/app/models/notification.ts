import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Transaction from './transaction.js'

export type NotificationType =
  | 'deadline_warning'
  | 'daily_digest'
  | 'condition_created'
  | 'condition_completed'
  | 'condition_resolved'
  | 'step_advanced'
  | 'step_skipped'
  | 'transaction_cancelled'
  | 'offer_created'
  | 'offer_countered'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'offer_withdrawn'
  | 'offer_update'
  | 'member_invited'
  | 'party_added'
  | 'share_link_created'
  | 'email_recap_sent'

export type NotificationSeverity = 'info' | 'warning' | 'urgent'

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare transactionId: number | null

  @column()
  declare type: NotificationType | (string & {})

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
