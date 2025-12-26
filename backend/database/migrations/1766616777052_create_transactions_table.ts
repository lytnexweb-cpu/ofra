import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('owner_user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('client_id').unsigned().references('id').inTable('clients').onDelete('CASCADE')
      table.integer('property_id').unsigned().references('id').inTable('properties').onDelete('SET NULL').nullable()
      table.enum('type', ['purchase', 'sale']).notNullable()
      table.enum('status', [
        'consultation',
        'offer',
        'accepted',
        'conditions',
        'notary',
        'closing',
        'completed',
        'canceled',
      ]).notNullable().defaultTo('consultation')
      table.decimal('sale_price', 12, 2).nullable()
      table.text('notes').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index('owner_user_id')
      table.index('status')
      table.index('client_id')
      table.index('property_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
