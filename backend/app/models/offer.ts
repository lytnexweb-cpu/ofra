import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import OfferRevision from './offer_revision.js'
import TransactionParty from './transaction_party.js'

export type OfferStatus = 'received' | 'countered' | 'accepted' | 'rejected' | 'expired' | 'withdrawn'

export default class Offer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

  @column()
  declare status: OfferStatus

  @column()
  declare buyerPartyId: number | null

  @column()
  declare sellerPartyId: number | null

  @column()
  declare initialDirection: string

  @column.dateTime()
  declare acceptedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => OfferRevision, { foreignKey: 'offerId' })
  declare revisions: HasMany<typeof OfferRevision>

  @belongsTo(() => TransactionParty, { foreignKey: 'buyerPartyId' })
  declare buyerParty: BelongsTo<typeof TransactionParty>

  @belongsTo(() => TransactionParty, { foreignKey: 'sellerPartyId' })
  declare sellerParty: BelongsTo<typeof TransactionParty>
}
