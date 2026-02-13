import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction from './transaction.js'
import User from './user.js'

export type ActivityType =
  | 'transaction_created'
  | 'transaction_cancelled'
  | 'transaction_archived'
  | 'transaction_restored'
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
  | 'document_uploaded'
  | 'document_validated'
  | 'document_rejected'
  | 'member_invited'
  | 'member_role_changed'
  | 'member_removed'
  | 'share_link_created'
  | 'share_link_revoked'
  | 'pdf_exported'
  | 'automation_executed'
  | 'automation_scheduled'
  | 'email_sent'
  | 'task_created'
  | 'offer_intake_received'

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
