import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('transaction_id').unsigned().references('id').inTable('transactions').onDelete('CASCADE')
      table.integer('author_user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.text('content').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index('transaction_id')
      table.index('author_user_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
