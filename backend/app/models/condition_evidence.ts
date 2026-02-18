import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Condition from './condition.js'
import User from './user.js'

export type EvidenceType = 'file' | 'link' | 'note'

/**
 * ConditionEvidence Model
 *
 * Preuves attachées aux conditions (documents, liens, notes)
 * Part of Conditions Engine Premium (D27)
 */
export default class ConditionEvidence extends BaseModel {
  static table = 'condition_evidence'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare conditionId: number

  @column()
  declare type: EvidenceType

  @column()
  declare fileUrl: string | null

  @column()
  declare url: string | null

  @column()
  declare note: string | null

  @column()
  declare title: string | null

  @column()
  declare createdBy: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relations
  @belongsTo(() => Condition, { foreignKey: 'conditionId' })
  declare condition: BelongsTo<typeof Condition>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>
}
