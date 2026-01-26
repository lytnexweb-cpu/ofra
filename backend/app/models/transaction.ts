import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Client from './client.js'
import Property from './property.js'
import Condition from './condition.js'
import Note from './note.js'
import TransactionStatusHistory from './transaction_status_history.js'
import Offer from './offer.js'

export type TransactionStatus =
  | 'active'
  | 'offer'
  | 'conditional'
  | 'firm'
  | 'closing'
  | 'completed'
  | 'cancelled'

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

  @column({ columnName: 'list_price' })
  declare listPrice: number | null

  @column()
  declare commission: number | null

  @column({ columnName: 'folder_url' })
  declare folderUrl: string | null

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

  @hasMany(() => Offer, { foreignKey: 'transactionId' })
  declare offers: HasMany<typeof Offer>

  @hasMany(() => Note, { foreignKey: 'transactionId' })
  declare notes: HasMany<typeof Note>

  @hasMany(() => TransactionStatusHistory, { foreignKey: 'transactionId' })
  declare statusHistories: HasMany<typeof TransactionStatusHistory>
}
