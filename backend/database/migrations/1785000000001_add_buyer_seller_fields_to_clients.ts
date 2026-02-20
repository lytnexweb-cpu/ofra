import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clients'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Buyer fields
      table.boolean('is_pre_approved').nullable().defaultTo(null)
      table.decimal('pre_approval_amount', 12, 2).nullable().defaultTo(null)
      table.string('pre_approval_lender', 255).nullable().defaultTo(null)
      table.decimal('financing_budget', 12, 2).nullable().defaultTo(null)
      // Seller fields
      table.string('motivation_level', 20).nullable().defaultTo(null)
      table.decimal('floor_price', 12, 2).nullable().defaultTo(null)
      table.date('target_close_date').nullable().defaultTo(null)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_pre_approved')
      table.dropColumn('pre_approval_amount')
      table.dropColumn('pre_approval_lender')
      table.dropColumn('financing_budget')
      table.dropColumn('motivation_level')
      table.dropColumn('floor_price')
      table.dropColumn('target_close_date')
    })
  }
}
