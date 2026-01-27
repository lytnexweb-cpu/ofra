import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'workflow_step_automations'

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
      table
        .enum('trigger', ['on_enter', 'on_exit', 'on_condition_complete'], {
          useNative: true,
          enumName: 'wf_automation_trigger',
          existingType: false,
        })
        .notNullable()
      table.string('action_type').notNullable()
      table.integer('delay_days').defaultTo(0)
      table.string('template_ref').nullable()
      table.jsonb('config').defaultTo('{}')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index(['step_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS "wf_automation_trigger"')
  }
}
