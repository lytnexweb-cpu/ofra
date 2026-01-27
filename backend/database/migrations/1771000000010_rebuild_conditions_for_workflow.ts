import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conditions'

  async up() {
    // Drop CHECK constraint on stage if it exists
    this.defer(async (db) => {
      const result = await db.rawQuery(`
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'conditions' AND constraint_type = 'CHECK'
      `)
      for (const row of result.rows) {
        if (row.constraint_name.includes('stage')) {
          await db.rawQuery(`ALTER TABLE conditions DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`)
        }
      }
    })

    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('transaction_step_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('transaction_steps')
        .onDelete('SET NULL')
    })

    // Drop the stage column
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('stage')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('stage').nullable()
      table.dropColumn('transaction_step_id')
    })
  }
}
