import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_parties'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('transaction_id').unsigned().notNullable().references('id').inTable('transactions').onDelete('CASCADE')
      table.string('role', 20).notNullable()
      table.string('full_name', 255).notNullable()
      table.string('email', 255).nullable()
      table.string('phone', 50).nullable()
      table.string('address', 500).nullable()
      table.string('company', 255).nullable()
      table.boolean('is_primary').defaultTo(false)
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['transaction_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
