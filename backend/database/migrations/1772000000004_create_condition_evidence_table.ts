import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration: Create condition_evidence table
 * Part of Conditions Engine Premium (D27)
 *
 * Preuves attachées aux conditions (documents, liens, notes)
 */
export default class extends BaseSchema {
  protected tableName = 'condition_evidence'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Lien vers condition
      table.integer('condition_id').unsigned().notNullable()
        .references('id').inTable('conditions').onDelete('CASCADE')

      // Type de preuve
      table.enum('type', ['file', 'link', 'note']).notNullable()

      // Contenu
      table.string('file_url', 2000).nullable() // Si type='file' (URL S3)
      table.string('url', 2000).nullable() // Si type='link'
      table.text('note').nullable() // Si type='note'
      table.string('title', 255).nullable()

      // Audit
      table.integer('created_by').unsigned().notNullable()
        .references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('created_at').notNullable().defaultTo(this.now())

      // Index
      table.index(['condition_id'], 'idx_evidence_condition')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
