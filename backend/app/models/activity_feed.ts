import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction from './transaction.js'
import User from './user.js'

export type ActivityType =
  | 'transaction_created'
  | 'step_entered'
  | 'step_completed'
  | 'step_skipped'
  | 'condition_created'
  | 'condition_completed'
  | 'offer_created'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'offer_withdrawn'
  | 'note_added'
  | 'automation_executed'
  | 'automation_scheduled'
  | 'email_sent'
  | 'task_created'

export default class ActivityFeed extends BaseModel {
  static table = 'activity_feed'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

  @column()
  declare userId: number | null

  @column()
  declare activityType: ActivityType

  @column()
  declare metadata: Record<string, any>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare user: BelongsTo<typeof User>
}
