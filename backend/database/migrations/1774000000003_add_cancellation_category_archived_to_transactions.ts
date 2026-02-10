import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('cancellation_category', 50).nullable()
      table.timestamp('archived_at').nullable()
      table.string('archived_reason', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cancellation_category')
      table.dropColumn('archived_at')
      table.dropColumn('archived_reason')
    })
  }
}
