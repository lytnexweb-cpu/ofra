import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_templates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      table.text('description').nullable()
      table.enum('transaction_type', ['purchase', 'sale']).notNullable()
      table.boolean('is_default').notNullable().defaultTo(false)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('owner_user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index('transaction_type')
      table.index('is_active')
      table.index('owner_user_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
