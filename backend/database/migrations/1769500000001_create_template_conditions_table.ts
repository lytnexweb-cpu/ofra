import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'template_conditions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('template_id').unsigned().references('id').inTable('transaction_templates').onDelete('CASCADE')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.enum('type', [
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
      ]).notNullable().defaultTo('other')
      table.enum('priority', ['low', 'medium', 'high']).notNullable().defaultTo('medium')
      table.enum('stage', [
        'consultation',
        'offer',
        'accepted',
        'conditions',
        'notary',
        'closing',
        'completed',
        'canceled',
      ]).notNullable().defaultTo('conditions')
      table.boolean('is_blocking').notNullable().defaultTo(false)
      table.integer('due_date_offset_days').notNullable().defaultTo(7)
      table.integer('sort_order').notNullable().defaultTo(0)
      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index('template_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
