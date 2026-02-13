import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'transaction_share_links'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('link_type', 20).notNullable().defaultTo('viewer')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('link_type')
    })
  }
}
