import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.integer('transaction_id').unsigned().nullable().references('id').inTable('transactions').onDelete('CASCADE')
      table.string('type', 50).notNullable()
      table.string('title', 255).notNullable()
      table.text('body').nullable()
      table.string('icon', 10).nullable()
      table.string('severity', 20).notNullable().defaultTo('info')
      table.string('link', 500).nullable()
      table.specificType('email_recipients', 'text[]').nullable()
      table.timestamp('read_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      // Indexes for performance
      table.index(['user_id', 'read_at'], 'idx_notifications_user_unread')
      table.index(['user_id', 'created_at'], 'idx_notifications_user_created')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
