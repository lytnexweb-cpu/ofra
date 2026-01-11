import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Offer Details fields
      table.decimal('list_price', 12, 2).nullable()
      table.decimal('offer_price', 12, 2).nullable()
      table.boolean('counter_offer_enabled').defaultTo(false).notNullable()
      table.decimal('counter_offer_price', 12, 2).nullable()
      table.timestamp('offer_expiry_at', { useTz: true }).nullable()
      table.decimal('commission', 12, 2).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('list_price')
      table.dropColumn('offer_price')
      table.dropColumn('counter_offer_enabled')
      table.dropColumn('counter_offer_price')
      table.dropColumn('offer_expiry_at')
      table.dropColumn('commission')
    })
  }
}
