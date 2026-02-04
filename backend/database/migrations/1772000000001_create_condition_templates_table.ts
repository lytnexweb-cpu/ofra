import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration: Create condition_templates table
 * Part of Conditions Engine Premium (D27)
 *
 * Templates de conditions issus des Packs (Rural NB, Condo NB, Financé NB)
 */
export default class extends BaseSchema {
  protected tableName = 'condition_templates'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Contenu bilingue
      table.string('label_fr', 500).notNullable()
      table.string('label_en', 500).notNullable()
      table.text('description_fr').nullable()
      table.text('description_en').nullable()

      // Classification
      table.enum('level', ['blocking', 'required', 'recommended']).notNullable()
      table.enum('source_type', ['legal', 'government', 'industry', 'best_practice']).notNullable()
      table.string('category', 100).nullable()

      // Applicabilité
      table.integer('step').nullable() // NULL = applicable à toutes les étapes
      table.jsonb('applies_when').notNullable().defaultTo('{}')

      // Métadonnées
      table.string('pack', 50).nullable() // 'rural_nb', 'condo_nb', 'finance_nb', NULL=général
      table.integer('order').defaultTo(0)
      table.boolean('is_default').defaultTo(true)
      table.boolean('is_active').defaultTo(true)

      // Audit
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      // Index
      table.index(['step', 'is_active', 'is_default'], 'idx_templates_step_active')
    })

    // Index GIN pour applies_when (PostgreSQL)
    this.defer(async (db) => {
      await db.rawQuery(`
        CREATE INDEX idx_templates_applies_when ON condition_templates USING GIN (applies_when)
      `)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
