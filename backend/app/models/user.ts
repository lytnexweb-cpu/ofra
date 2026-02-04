import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, belongsTo, beforeSave } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import Organization from './organization.js'

// D40: Onboarding profile types
export type PracticeType = 'solo' | 'small_team' | 'agency'
export type PropertyContext = 'urban_suburban' | 'rural' | 'condo' | 'land'
export type AnnualVolume = 'beginner' | 'established' | 'high'

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

  // D40: Onboarding profile
  @column()
  declare practiceType: PracticeType | null

  // D40: Property contexts - JSON array stored as string in DB
  @column({
    prepare: (value: PropertyContext[] | null | undefined) => {
      return JSON.stringify(value ?? [])
    },
    consume: (value: string | PropertyContext[] | null | undefined) => {
      if (!value) return []
      if (Array.isArray(value)) return value
      if (typeof value !== 'string' || value === '' || value === 'null') return []
      try {
        return JSON.parse(value)
      } catch {
        return []
      }
    },
  })
  declare propertyContexts: PropertyContext[]

  @column()
  declare annualVolume: AnnualVolume | null

  @column()
  declare preferAutoConditions: boolean

  @column()
  declare onboardingCompleted: boolean

  @column()
  declare onboardingSkipped: boolean

  @column.dateTime()
  declare onboardingCompletedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Organization, { foreignKey: 'organizationId' })
  declare organization: BelongsTo<typeof Organization>
}
