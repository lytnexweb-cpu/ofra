import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conditions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('type', [
          'inspection',
          'financing',
          'appraisal',
          'legal',
          'documents',
          'repairs',
          'other',
        ])
        .defaultTo('other')
      table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('type')
      table.dropColumn('priority')
    })
  }
}