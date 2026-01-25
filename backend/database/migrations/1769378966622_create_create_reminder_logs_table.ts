import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reminder_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Multi-tenant: owner_user_id
      table
        .integer('owner_user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()

      // Reminder type: 'digest' | 'due_48h' | 'overdue'
      table
        .enum('type', ['digest', 'due_48h', 'overdue'])
        .notNullable()

      // Polymorphic entity reference
      table
        .enum('entity_type', ['condition', 'transaction', 'user'])
        .notNullable()

      // Entity ID (nullable for user-level like digest)
      table.integer('entity_id').unsigned().nullable()

      // Date the reminder was sent (for deduplication)
      table.date('sent_on').notNullable()

      // Timestamp
      table.timestamp('sent_at').notNullable()

      // Indexes for query performance
      table.index('owner_user_id')
      table.index('type')
      table.index('sent_on')

      // Unique constraint for deduplication
      // (owner_user_id, type, entity_type, entity_id, sent_on)
      table.unique(['owner_user_id', 'type', 'entity_type', 'entity_id', 'sent_on'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
