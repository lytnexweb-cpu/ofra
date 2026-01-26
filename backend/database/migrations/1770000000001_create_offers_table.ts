import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Create offers table.
 * One transaction can have multiple offers (negotiation rounds).
 * Each offer tracks its status independently.
 */
export default class extends BaseSchema {
  protected tableName = 'offers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('transaction_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('transactions')
        .onDelete('CASCADE')
      table
        .enu('status', ['received', 'countered', 'accepted', 'rejected', 'expired', 'withdrawn'], {
          useNative: true,
          enumName: 'offer_status',
          existingType: false,
        })
        .notNullable()
        .defaultTo('received')
      table.timestamp('accepted_at', { useTz: true })
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Indexes
      table.index(['transaction_id'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS "offer_status"')
  }
}
