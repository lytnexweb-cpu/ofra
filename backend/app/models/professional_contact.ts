import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export type ProfessionalRole = 'inspector' | 'notary' | 'lawyer' | 'mortgage_broker' | 'appraiser' | 'other'

export default class ProfessionalContact extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare agentId: number

  @column()
  declare name: string

  @column()
  declare role: ProfessionalRole

  @column()
  declare phone: string | null

  @column()
  declare email: string | null

  @column()
  declare company: string | null

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'agentId' })
  declare agent: BelongsTo<typeof User>
}
