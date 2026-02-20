import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'conditions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('assigned_pro_id').unsigned().nullable().references('id').inTable('professional_contacts').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('assigned_pro_id')
    })
  }
}
