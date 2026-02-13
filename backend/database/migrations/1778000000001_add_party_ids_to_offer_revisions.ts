import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Add from_party_id and to_party_id to offer_revisions.
 * Links each offer revision to the actual TransactionParty
 * who sent and received it, enabling nominative display.
 *
 * Nullable for backward compatibility (existing revisions have no party link).
 * ON DELETE SET NULL: if a party is removed, the revision survives with fallback display.
 */
export default class extends BaseSchema {
  protected tableName = 'offer_revisions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('from_party_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('transaction_parties')
        .onDelete('SET NULL')

      table
        .integer('to_party_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('transaction_parties')
        .onDelete('SET NULL')

      table.index(['from_party_id'])
      table.index(['to_party_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('from_party_id')
      table.dropColumn('to_party_id')
    })
  }
}
