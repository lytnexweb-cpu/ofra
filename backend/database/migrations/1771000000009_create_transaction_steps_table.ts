import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_steps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('transaction_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('transactions')
        .onDelete('CASCADE')
      table
        .integer('workflow_step_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('workflow_steps')
        .onDelete('CASCADE')
      table.integer('step_order').notNullable()
      table
        .enum('status', ['pending', 'active', 'completed', 'skipped'], {
          useNative: true,
          enumName: 'transaction_step_status',
          existingType: false,
        })
        .defaultTo('pending')
      table.timestamp('entered_at').nullable()
      table.timestamp('completed_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['transaction_id', 'workflow_step_id'])
      table.unique(['transaction_id', 'step_order'])
      table.index(['transaction_id'])
      table.index(['status'])
    })

    // Add FK from transactions.current_step_id → transaction_steps.id
    this.schema.alterTable('transactions', (table) => {
      table
        .foreign('current_step_id')
        .references('id')
        .inTable('transaction_steps')
        .onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable('transactions', (table) => {
      table.dropForeign('current_step_id')
    })
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS "transaction_step_status"')
  }
}
