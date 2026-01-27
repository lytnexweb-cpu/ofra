import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'workflow_step_conditions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('step_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('workflow_steps')
        .onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('condition_type').notNullable()
      table
        .enum('priority', ['low', 'medium', 'high'], {
          useNative: true,
          enumName: 'wf_condition_priority',
          existingType: false,
        })
        .defaultTo('medium')
      table.boolean('is_blocking_default').defaultTo(true)
      table.boolean('is_required').defaultTo(true)
      table
        .integer('depends_on_step_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('workflow_steps')
        .onDelete('SET NULL')
      table.integer('due_date_offset_days').nullable()
      table.integer('sort_order').defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index(['step_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS "wf_condition_priority"')
  }
}
