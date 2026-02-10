import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Transaction from './transaction.js'
import Condition from './condition.js'
import User from './user.js'

export type DocumentCategory = 'offer' | 'inspection' | 'financing' | 'identity' | 'legal' | 'other'
export type DocumentStatus = 'missing' | 'uploaded' | 'validated' | 'rejected'

export default class TransactionDocument extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare transactionId: number

  @column()
  declare conditionId: number | null

  @column()
  declare category: DocumentCategory

  @column()
  declare name: string

  @column()
  declare fileUrl: string | null

  @column()
  declare fileSize: number | null

  @column()
  declare mimeType: string | null

  @column()
  declare status: DocumentStatus

  @column()
  declare version: number

  @column()
  declare parentDocumentId: number | null

  @column({ prepare: (value: string[] | null) => value ? JSON.stringify(value) : null })
  declare tags: string[] | null

  @column()
  declare rejectionReason: string | null

  @column()
  declare validatedBy: number | null

  @column.dateTime()
  declare validatedAt: DateTime | null

  @column()
  declare uploadedBy: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Transaction, { foreignKey: 'transactionId' })
  declare transaction: BelongsTo<typeof Transaction>

  @belongsTo(() => Condition, { foreignKey: 'conditionId' })
  declare condition: BelongsTo<typeof Condition>

  @belongsTo(() => User, { foreignKey: 'uploadedBy' })
  declare uploader: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'validatedBy' })
  declare validator: BelongsTo<typeof User>

  @belongsTo(() => TransactionDocument, { foreignKey: 'parentDocumentId' })
  declare parentDocument: BelongsTo<typeof TransactionDocument>
}
