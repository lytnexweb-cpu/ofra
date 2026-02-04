import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transactions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('status', 20).defaultTo('active').notNullable()
      table.timestamp('cancelled_at').nullable()
      table.string('cancellation_reason', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
      table.dropColumn('cancelled_at')
      table.dropColumn('cancellation_reason')
    })
  }
}
