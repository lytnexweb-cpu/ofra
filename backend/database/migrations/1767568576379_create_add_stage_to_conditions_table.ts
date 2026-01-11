import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conditions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('stage', [
          'consultation',
          'offer',
          'accepted',
          'conditions',
          'notary',
          'closing',
          'completed',
          'canceled',
        ])
        .defaultTo('conditions')
        .notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('stage')
    })
  }
}
