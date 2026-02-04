import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * D41 - Garde-fous validation conditions
 *
 * Adds fields to track when a condition is completed without proof:
 * - escaped_without_proof: boolean flag
 * - escape_reason: required reason when escaping
 * - escape_confirmed_at: timestamp of escape confirmation
 */
export default class extends BaseSchema {
  protected tableName = 'conditions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // D41: Track escape without proof
      table.boolean('escaped_without_proof').defaultTo(false).notNullable()
      table.text('escape_reason').nullable()
      table.timestamp('escape_confirmed_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('escaped_without_proof')
      table.dropColumn('escape_reason')
      table.dropColumn('escape_confirmed_at')
    })
  }
}
