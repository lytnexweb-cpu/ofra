import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import TemplateCondition from './template_condition.js'
import type { TransactionType } from './transaction.js'

export default class TransactionTemplate extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column({ columnName: 'transaction_type' })
  declare transactionType: TransactionType

  @column({ columnName: 'is_default' })
  declare isDefault: boolean

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column({ columnName: 'owner_user_id' })
  declare ownerUserId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'ownerUserId' })
  declare owner: BelongsTo<typeof User>

  @hasMany(() => TemplateCondition, { foreignKey: 'templateId' })
  declare conditions: HasMany<typeof TemplateCondition>
}
