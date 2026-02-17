import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Add buyer/seller party tracking to offers.
 * Enables offer-level party identification for FINTRAC and negotiation thread display.
 */
export default class extends BaseSchema {
  protected tableName = 'offers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('buyer_party_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('transaction_parties')
        .onDelete('SET NULL')
      table
        .integer('seller_party_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('transaction_parties')
        .onDelete('SET NULL')
      table
        .string('initial_direction', 50)
        .defaultTo('buyer_to_seller')

      table.index(['buyer_party_id'])
      table.index(['seller_party_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['buyer_party_id'])
      table.dropIndex(['seller_party_id'])
      table.dropColumn('buyer_party_id')
      table.dropColumn('seller_party_id')
      table.dropColumn('initial_direction')
    })
  }
}
