import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'site_settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('key', 100).notNullable().unique()
      table.text('value').nullable()
      table.integer('updated_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    // Seed initial values
    this.defer(async (db) => {
      await db.table(this.tableName).multiInsert([
        { key: 'site_mode', value: 'coming_soon' },
        { key: 'access_code', value: 'OFRA-FOUNDER-2026' },
        { key: 'custom_message', value: '' },
        { key: 'launch_date', value: '2026-03-20' },
        { key: 'pitch_points', value: '[]' },
        { key: 'show_founder_count', value: 'true' },
      ])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
