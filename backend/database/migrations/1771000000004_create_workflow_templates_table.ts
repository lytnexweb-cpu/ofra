import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'workflow_templates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('province_code', 2).notNullable()
      table.string('name').notNullable()
      table.string('slug').notNullable()
      table.text('description').nullable()
      table
        .enum('transaction_type', ['purchase', 'sale'], {
          useNative: true,
          enumName: 'workflow_transaction_type',
          existingType: false,
        })
        .notNullable()
      table.boolean('is_default').defaultTo(false)
      table.boolean('is_active').defaultTo(true)
      table
        .integer('created_by_user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table
        .integer('organization_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('organizations')
        .onDelete('SET NULL')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.unique(['province_code', 'slug'])
      table.index(['province_code'])
      table.index(['transaction_type'])
      table.index(['is_active'])
      table.index(['organization_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS "workflow_transaction_type"')
  }
}
