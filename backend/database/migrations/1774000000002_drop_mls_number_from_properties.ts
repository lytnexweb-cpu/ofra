import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'properties'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('mls_number')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('mls_number', 50).nullable()
    })
  }
}
