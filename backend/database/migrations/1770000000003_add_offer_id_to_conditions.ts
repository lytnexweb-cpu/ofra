import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Add offer_id to conditions table.
 * Conditions can optionally be linked to a specific offer.
 * This allows tracking which conditions belong to which offer.
 */
export default class extends BaseSchema {
  protected tableName = 'conditions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('offer_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('offers')
        .onDelete('SET NULL')
      table.index(['offer_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('offer_id')
    })
  }
}
