import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    // Drop CHECK constraint on status if it exists (from previous migrations)
    this.defer(async (db) => {
      const result = await db.rawQuery(`
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'transactions' AND constraint_type = 'CHECK'
      `)
      for (const row of result.rows) {
        await db.rawQuery(`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`)
      }
    })

    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('workflow_template_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('workflow_templates')
        .onDelete('SET NULL')
      table.integer('current_step_id').unsigned().nullable()
      table
        .integer('organization_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('organizations')
        .onDelete('SET NULL')
    })

    // Drop the status column
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('status').defaultTo('active')
      table.dropColumn('workflow_template_id')
      table.dropColumn('current_step_id')
      table.dropColumn('organization_id')
    })
  }
}
