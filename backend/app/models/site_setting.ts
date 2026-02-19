import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class SiteSetting extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare key: string

  @column()
  declare value: string | null

  @column()
  declare updatedBy: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Get a single setting value by key
   */
  static async get(key: string): Promise<string | null> {
    const setting = await this.query().where('key', key).first()
    return setting?.value ?? null
  }

  /**
   * Set a single setting value
   */
  static async set(key: string, value: string, userId?: number): Promise<void> {
    await this.query()
      .where('key', key)
      .update({
        value,
        updated_by: userId ?? null,
        updated_at: DateTime.now().toSQL(),
      })
  }

  /**
   * Get all settings as a key-value record
   */
  static async getAll(): Promise<Record<string, string>> {
    const settings = await this.query()
    const result: Record<string, string> = {}
    for (const setting of settings) {
      result[setting.key] = setting.value ?? ''
    }
    return result
  }
}
