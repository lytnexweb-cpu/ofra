import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.date('closing_date').nullable()
      table.date('offer_expiry_date').nullable()
      table.date('inspection_deadline').nullable()
      table.date('financing_deadline').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('closing_date')
      table.dropColumn('offer_expiry_date')
      table.dropColumn('inspection_deadline')
      table.dropColumn('financing_deadline')
    })
  }
}
