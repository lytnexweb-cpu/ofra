import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('address', 500).nullable()
      table.string('city', 255).nullable()
      table.string('province_code', 10).nullable().defaultTo('NB')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('address')
      table.dropColumn('city')
      table.dropColumn('province_code')
    })
  }
}
