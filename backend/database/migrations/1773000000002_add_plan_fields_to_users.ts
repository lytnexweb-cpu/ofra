import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('plan_id').unsigned().nullable().references('id').inTable('plans').onDelete('SET NULL')
      table.boolean('is_founder').notNullable().defaultTo(false)
      table.enum('billing_cycle', ['monthly', 'annual']).notNullable().defaultTo('monthly')
      table.decimal('plan_locked_price', 10, 2).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('plan_locked_price')
      table.dropColumn('billing_cycle')
      table.dropColumn('is_founder')
      table.dropColumn('plan_id')
    })
  }
}
