import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'workflow_steps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('template_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('workflow_templates')
        .onDelete('CASCADE')
      table.integer('step_order').notNullable()
      table.string('name').notNullable()
      table.string('slug').notNullable()
      table.text('description').nullable()
      table.integer('typical_duration_days').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['template_id', 'step_order'])
      table.unique(['template_id', 'slug'])
      table.index(['template_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
