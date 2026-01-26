import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Offer from './offer.js'
import User from './user.js'

export type OfferDirection = 'buyer_to_seller' | 'seller_to_buyer'

export default class OfferRevision extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare offerId: number

  @column()
  declare revisionNumber: number

  @column()
  declare price: number

  @column()
  declare deposit: number | null

  @column()
  declare financingAmount: number | null

  @column.dateTime()
  declare expiryAt: DateTime | null

  @column()
  declare notes: string | null

  @column()
  declare direction: OfferDirection

  @column()
  declare createdByUserId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Offer, { foreignKey: 'offerId' })
  declare offer: BelongsTo<typeof Offer>

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare createdBy: BelongsTo<typeof User>
}
