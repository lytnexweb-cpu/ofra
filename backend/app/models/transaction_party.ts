import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import Transaction from './transaction.js'
import FintracRecord from './fintrac_record.js'

export type PartyRole = 'buyer' | 'seller' | 'lawyer' | 'notary' | 'agent' | 'broker' | 'other'

export default class TransactionParty extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

  @column()
  declare role: PartyRole

  @column()
  declare fullName: string

  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column()
  declare address: string | null

  @column()
  declare company: string | null

  @column()
  declare isPrimary: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>

  @hasOne(() => FintracRecord, { foreignKey: 'partyId' })
  declare fintracRecord: HasOne<typeof FintracRecord>
}
