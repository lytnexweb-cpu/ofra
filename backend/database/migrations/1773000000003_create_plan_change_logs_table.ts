import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plan_change_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('plan_id').unsigned().notNullable().references('id').inTable('plans').onDelete('CASCADE')
      table.integer('admin_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('field_changed', 100).notNullable()
      table.string('old_value', 500).nullable()
      table.string('new_value', 500).nullable()
      table.string('reason', 500).notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())

      table.index(['plan_id', 'created_at'], 'idx_plan_logs_plan_date')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
