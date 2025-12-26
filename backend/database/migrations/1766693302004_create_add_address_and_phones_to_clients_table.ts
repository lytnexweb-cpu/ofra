import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'clients'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('address_line1').nullable()
      table.string('address_line2').nullable()
      table.string('city').nullable()
      table.string('province_state').nullable()
      table.string('postal_code').nullable()
      table.string('home_phone').nullable()
      table.string('work_phone').nullable()
      table.string('cell_phone').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('address_line1')
      table.dropColumn('address_line2')
      table.dropColumn('city')
      table.dropColumn('province_state')
      table.dropColumn('postal_code')
      table.dropColumn('home_phone')
      table.dropColumn('work_phone')
      table.dropColumn('cell_phone')
    })
  }
}