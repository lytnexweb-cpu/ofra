import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type PromoType = 'percent' | 'fixed' | 'free_months'

export default class PromoCode extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare type: PromoType

  @column()
  declare value: number

  @column()
  declare maxUses: number | null

  @column()
  declare currentUses: number

  @column()
  declare validFrom: string | null

  @column()
  declare validUntil: string | null

  @column({
    prepare: (value: number[] | null | undefined) => {
      return value ? JSON.stringify(value) : null
    },
    consume: (value: string | number[] | null | undefined) => {
      if (!value) return null
      if (Array.isArray(value)) return value
      if (typeof value !== 'string') return null
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    },
  })
  declare eligiblePlans: number[] | null

  @column()
  declare active: boolean

  @column()
  declare stripeCouponId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Check if this promo code is currently valid
   */
  isValid(): boolean {
    if (!this.active) return false
    if (this.maxUses !== null && this.currentUses >= this.maxUses) return false

    const now = DateTime.now().toISODate()
    if (this.validFrom && now! < this.validFrom) return false
    if (this.validUntil && now! > this.validUntil) return false

    return true
  }
}
