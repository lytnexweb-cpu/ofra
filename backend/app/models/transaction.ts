import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Client from './client.js'
import Property from './property.js'
import Condition from './condition.js'
import Note from './note.js'
import Offer from './offer.js'
import Organization from './organization.js'
import WorkflowTemplate from './workflow_template.js'
import TransactionStep from './transaction_step.js'
import ActivityFeed from './activity_feed.js'
import TransactionParty from './transaction_party.js'
import TransactionDocument from './transaction_document.js'
import TransactionMember from './transaction_member.js'
import TransactionShareLink from './transaction_share_link.js'

export type TransactionType = 'purchase' | 'sale'
export type TransactionStatus = 'active' | 'cancelled' | 'archived'

export type CancellationCategory =
  | 'financing_refused'
  | 'inspection_failed'
  | 'buyer_withdrawal'
  | 'seller_withdrawal'
  | 'deadline_expired'
  | 'mutual_agreement'
  | 'other'

export default class Transaction extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare ownerUserId: number

  @column()
  declare status: TransactionStatus

  @column()
  declare clientId: number

  @column()
  declare propertyId: number | null

  @column()
  declare type: TransactionType

  @column()
  declare workflowTemplateId: number | null

  @column()
  declare currentStepId: number | null

  @column()
  declare organizationId: number | null

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

  @column.dateTime({ columnName: 'cancelled_at' })
  declare cancelledAt: DateTime | null

  @column({ columnName: 'cancellation_reason' })
  declare cancellationReason: string | null

  @column({ columnName: 'cancellation_category' })
  declare cancellationCategory: CancellationCategory | null

  @column.dateTime({ columnName: 'archived_at' })
  declare archivedAt: DateTime | null

  @column({ columnName: 'archived_reason' })
  declare archivedReason: string | null

  @column.date({ columnName: 'closing_date' })
  declare closingDate: DateTime | null

  @column.date({ columnName: 'offer_expiry_date' })
  declare offerExpiryDate: DateTime | null

  @column.date({ columnName: 'inspection_deadline' })
  declare inspectionDeadline: DateTime | null

  @column.date({ columnName: 'financing_deadline' })
  declare financingDeadline: DateTime | null

  @column({ columnName: 'tags', prepare: (value: string[] | null) => value ? JSON.stringify(value) : null })
  declare tags: string[] | null

  @column()
  declare language: string | null

  @column({ columnName: 'auto_conditions_enabled' })
  declare autoConditionsEnabled: boolean

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

  @belongsTo(() => WorkflowTemplate, { foreignKey: 'workflowTemplateId' })
  declare workflowTemplate: BelongsTo<typeof WorkflowTemplate>

  @belongsTo(() => TransactionStep, { foreignKey: 'currentStepId' })
  declare currentStep: BelongsTo<typeof TransactionStep>

  @belongsTo(() => Organization, { foreignKey: 'organizationId' })
  declare organization: BelongsTo<typeof Organization>

  @hasMany(() => TransactionStep, { foreignKey: 'transactionId' })
  declare transactionSteps: HasMany<typeof TransactionStep>

  @hasMany(() => Condition, { foreignKey: 'transactionId' })
  declare conditions: HasMany<typeof Condition>

  @hasMany(() => Offer, { foreignKey: 'transactionId' })
  declare offers: HasMany<typeof Offer>

  @hasMany(() => Note, { foreignKey: 'transactionId' })
  declare notes: HasMany<typeof Note>

  @hasMany(() => ActivityFeed, { foreignKey: 'transactionId' })
  declare activities: HasMany<typeof ActivityFeed>

  @hasMany(() => TransactionParty, { foreignKey: 'transactionId' })
  declare parties: HasMany<typeof TransactionParty>

  @hasMany(() => TransactionDocument, { foreignKey: 'transactionId' })
  declare documents: HasMany<typeof TransactionDocument>

  @hasMany(() => TransactionMember, { foreignKey: 'transactionId' })
  declare members: HasMany<typeof TransactionMember>

  @hasMany(() => TransactionShareLink, { foreignKey: 'transactionId' })
  declare shareLinks: HasMany<typeof TransactionShareLink>
}
