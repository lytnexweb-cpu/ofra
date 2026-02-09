import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 100).notNullable()
      table.string('slug', 50).notNullable().unique()
      table.decimal('monthly_price', 10, 2).notNullable()
      table.decimal('annual_price', 10, 2).notNullable()
      table.integer('max_transactions').nullable() // null = unlimited
      table.decimal('max_storage_gb', 10, 2).notNullable().defaultTo(1)
      table.integer('history_months').nullable() // null = unlimited
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('display_order').notNullable().defaultTo(0)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.index(['is_active', 'display_order'], 'idx_plans_active_order')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
