import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Client from './client.js'
import Property from './property.js'
import Condition from './condition.js'
import Note from './note.js'

export type TransactionStatus =
  | 'consultation'
  | 'offer'
  | 'accepted'
  | 'conditions'
  | 'notary'
  | 'closing'
  | 'completed'
  | 'canceled'

export type TransactionType = 'purchase' | 'sale'

export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare ownerUserId: number

  @column()
  declare clientId: number

  @column()
  declare propertyId: number | null

  @column()
  declare type: TransactionType

  @column()
  declare status: TransactionStatus

  @column()
  declare salePrice: number | null

  @column()
  declare notesText: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'ownerUserId' })
  declare owner: BelongsTo<typeof User>

  @belongsTo(() => Client, { foreignKey: 'clientId' })
  declare client: BelongsTo<typeof Client>

  @belongsTo(() => Property, { foreignKey: 'propertyId' })
  declare property: BelongsTo<typeof Property>

  @hasMany(() => Condition, { foreignKey: 'transactionId' })
  declare conditions: HasMany<typeof Condition>

  @hasMany(() => Note, { foreignKey: 'transactionId' })
  declare notes: HasMany<typeof Note>
}
