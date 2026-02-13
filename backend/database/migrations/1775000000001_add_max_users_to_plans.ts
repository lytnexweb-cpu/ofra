import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plans'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('max_users').notNullable().defaultTo(1)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('max_users')
    })
  }
}
