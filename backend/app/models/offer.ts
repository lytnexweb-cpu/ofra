import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import OfferRevision from './offer_revision.js'

export type OfferStatus = 'received' | 'countered' | 'accepted' | 'rejected' | 'expired' | 'withdrawn'

export default class Offer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

  @column()
  declare status: OfferStatus

  @column.dateTime()
  declare acceptedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => OfferRevision, { foreignKey: 'offerId' })
  declare revisions: HasMany<typeof OfferRevision>
}
