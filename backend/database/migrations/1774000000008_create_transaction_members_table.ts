import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('transaction_id').unsigned().notNullable()
        .references('id').inTable('transactions').onDelete('CASCADE')
      table.integer('user_id').unsigned().nullable()
        .references('id').inTable('users').onDelete('CASCADE')
      table.string('email', 255).nullable()
      table.string('role', 20).notNullable().defaultTo('viewer')
      table.string('status', 20).notNullable().defaultTo('pending')
      table.integer('invited_by').unsigned().nullable()
        .references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('invited_at', { useTz: true }).nullable()
      table.timestamp('accepted_at', { useTz: true }).nullable()
      table.timestamp('revoked_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Indexes
      table.index('transaction_id')
      table.index('user_id')
      table.index('email')

      // Unique constraints: no duplicate user or email per transaction
      table.unique(['transaction_id', 'user_id'])
      table.unique(['transaction_id', 'email'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
