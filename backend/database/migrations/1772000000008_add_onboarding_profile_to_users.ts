import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * D40 - Onboarding personnalisé
 *
 * Adds user profile fields for personalization:
 * - practiceType: solo | small_team | agency
 * - propertyContexts: JSON array of contexts
 * - annualVolume: beginner | established | high
 * - preferAutoConditions: boolean (D39 integration)
 * - onboardingCompleted: boolean
 * - onboardingSkipped: boolean (tracks if user skipped)
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // D40: Practice type
      table.enum('practice_type', ['solo', 'small_team', 'agency']).nullable()

      // D40: Property contexts (multi-select, stored as JSON)
      table.json('property_contexts').nullable()

      // D40: Annual volume
      table.enum('annual_volume', ['beginner', 'established', 'high']).nullable()

      // D40: Preference for auto conditions (links to D39)
      table.boolean('prefer_auto_conditions').defaultTo(true)

      // D40: Onboarding status
      table.boolean('onboarding_completed').defaultTo(false).notNullable()
      table.boolean('onboarding_skipped').defaultTo(false).notNullable()
      table.timestamp('onboarding_completed_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('practice_type')
      table.dropColumn('property_contexts')
      table.dropColumn('annual_volume')
      table.dropColumn('prefer_auto_conditions')
      table.dropColumn('onboarding_completed')
      table.dropColumn('onboarding_skipped')
      table.dropColumn('onboarding_completed_at')
    })
  }
}
