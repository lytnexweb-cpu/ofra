import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Condition from './condition.js'

export type ConditionEventType =
  | 'created'
  | 'started'
  | 'resolved'
  | 'archived'
  | 'evidence_added'
  | 'evidence_removed'
  | 'note_added'
  | 'level_changed_admin'
  | 'unarchived_admin'
  | 'condition_updated' // D38: deadline or description changed

/**
 * ConditionEvent Model (transaction_condition_events table)
 *
 * Audit trail complet - CRUCIAL POUR DEBUGGING ET LÉGAL
 * Part of Conditions Engine Premium (D27)
 */
export default class ConditionEvent extends BaseModel {
  static table = 'transaction_condition_events'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare conditionId: number

  @column()
  declare eventType: ConditionEventType

  @column()
  declare actorId: string // user_id ou 'system'

  @column()
  declare meta: Record<string, any>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relations
  @belongsTo(() => Condition, { foreignKey: 'conditionId' })
  declare condition: BelongsTo<typeof Condition>

  /**
   * Create a new event for a condition
   */
  static async log(
    conditionId: number,
    eventType: ConditionEventType,
    actorId: string | number,
    meta: Record<string, any> = {}
  ): Promise<ConditionEvent> {
    return await this.create({
      conditionId,
      eventType,
      actorId: String(actorId),
      meta,
    })
  }
}
