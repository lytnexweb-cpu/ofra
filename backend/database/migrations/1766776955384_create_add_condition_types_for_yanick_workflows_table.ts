import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conditions'

  async up() {
    // Drop the old type column and recreate it with the new values
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('type')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('type', [
          'financing',
          'deposit',
          'inspection',
          'water_test',
          'rpds_review',
          'appraisal',
          'legal',
          'documents',
          'repairs',
          'other',
        ])
        .defaultTo('financing')
    })
  }

  async down() {
    // Restore the old type column
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('type')
    })

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
    })
  }
}
