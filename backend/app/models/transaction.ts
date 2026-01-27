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
}
