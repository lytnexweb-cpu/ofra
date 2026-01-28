import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import Organization from './organization.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  // Profile information
  @column()
  declare phone: string | null

  @column()
  declare agency: string | null

  @column()
  declare licenseNumber: string | null

  @column()
  declare profilePhoto: string | null

  // Email signature
  @column()
  declare emailSignature: string | null

  // Display preferences
  @column()
  declare language: string

  @column()
  declare dateFormat: string

  @column()
  declare timezone: string

  // Organization & language
  @column()
  declare organizationId: number | null

  @column()
  declare preferredLanguage: string

  // Password reset
  @column()
  declare passwordResetToken: string | null

  @column.dateTime()
  declare passwordResetExpires: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Organization, { foreignKey: 'organizationId' })
  declare organization: BelongsTo<typeof Organization>
}
