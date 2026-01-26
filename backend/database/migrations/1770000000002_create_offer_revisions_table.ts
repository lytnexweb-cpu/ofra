import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Create offer_revisions table.
 * Each offer can have multiple revisions (initial offer, counter-offers, final acceptance).
 * Revision number tracks the negotiation sequence.
 * Direction indicates who made this revision (buyer_to_seller or seller_to_buyer).
 */
export default class extends BaseSchema {
  protected tableName = 'offer_revisions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('offer_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('offers')
        .onDelete('CASCADE')
      table.integer('revision_number').notNullable().defaultTo(1)
      table.decimal('price', 12, 2).notNullable()
      table.decimal('deposit', 12, 2)
      table.decimal('financing_amount', 12, 2)
      table.timestamp('expiry_at', { useTz: true })
      table.text('notes')
      table
        .enu('direction', ['buyer_to_seller', 'seller_to_buyer'], {
          useNative: true,
          enumName: 'offer_direction',
          existingType: false,
        })
        .notNullable()
        .defaultTo('buyer_to_seller')
      table
        .integer('created_by_user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('created_at', { useTz: true })

      // Indexes
      table.index(['offer_id'])
      table.unique(['offer_id', 'revision_number'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS "offer_direction"')
  }
}
