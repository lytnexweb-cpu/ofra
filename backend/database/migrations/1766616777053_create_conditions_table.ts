import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conditions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('transaction_id').unsigned().references('id').inTable('transactions').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.enum('status', ['pending', 'completed']).notNullable().defaultTo('pending')
      table.date('due_date').nullable()
      table.timestamp('completed_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index('transaction_id')
      table.index('status')
      table.index('due_date')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
