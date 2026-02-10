import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_share_links'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('transaction_id').unsigned().notNullable()
        .references('id').inTable('transactions').onDelete('CASCADE')
      table.string('token', 64).notNullable().unique()
      table.string('role', 20).notNullable().defaultTo('viewer')
      table.boolean('is_active').notNullable().defaultTo(false)
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.string('password_hash', 255).nullable()
      table.integer('created_by').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('last_accessed_at', { useTz: true }).nullable()
      table.integer('access_count').notNullable().defaultTo(0)
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index('transaction_id')
      table.index('token')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
