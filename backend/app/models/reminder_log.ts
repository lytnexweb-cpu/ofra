import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export type ReminderType = 'digest' | 'due_48h' | 'overdue'
export type EntityType = 'condition' | 'transaction' | 'user'

export default class ReminderLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'owner_user_id' })
  declare ownerUserId: number

  @column()
  declare type: ReminderType

  @column({ columnName: 'entity_type' })
  declare entityType: EntityType

  @column({ columnName: 'entity_id' })
  declare entityId: number | null

  @column.date({ columnName: 'sent_on' })
  declare sentOn: DateTime

  @column.dateTime({ columnName: 'sent_at' })
  declare sentAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'ownerUserId',
  })
  declare owner: BelongsTo<typeof User>
}
