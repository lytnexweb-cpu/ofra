import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration: Upgrade conditions table for Premium
 * Part of Conditions Engine Premium (D27)
 *
 * Adds: level, source_type, resolution_type, resolution_note,
 *       resolved_at, resolved_by, archived, archived_at, archived_step,
 *       step_when_created, step_when_resolved, template_id, label_fr, label_en
 */
export default class extends BaseSchema {
  protected tableName = 'conditions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Lien vers template (nullable si condition custom)
      table.integer('template_id').unsigned().nullable()
        .references('id').inTable('condition_templates').onDelete('SET NULL')

      // Snapshot bilingue (audit-proof si template change)
      table.string('label_fr', 500).nullable()
      table.string('label_en', 500).nullable()

      // Nouveau niveau (remplace is_blocking progressivement)
      table.enum('level', ['blocking', 'required', 'recommended']).nullable()
      table.enum('source_type', ['legal', 'government', 'industry', 'best_practice']).nullable()

      // Résolution Premium
      table.enum('resolution_type', ['completed', 'waived', 'not_applicable', 'skipped_with_risk']).nullable()
      table.text('resolution_note').nullable()
      table.timestamp('resolved_at').nullable()
      table.string('resolved_by', 100).nullable() // user_id ou 'system'

      // Archivage
      table.boolean('archived').notNullable().defaultTo(false)
      table.timestamp('archived_at').nullable()
      table.integer('archived_step').nullable()

      // Étapes
      table.integer('step_when_created').nullable()
      table.integer('step_when_resolved').nullable()
    })

    // Backfill: convertir is_blocking en level
    this.defer(async (db) => {
      // Blocking conditions
      await db.rawQuery(`
        UPDATE conditions
        SET level = 'blocking'
        WHERE is_blocking = true AND level IS NULL
      `)
      // Non-blocking conditions default to 'required'
      await db.rawQuery(`
        UPDATE conditions
        SET level = 'required'
        WHERE (is_blocking = false OR is_blocking IS NULL) AND level IS NULL
      `)
      // Set label_fr from title for existing conditions
      await db.rawQuery(`
        UPDATE conditions
        SET label_fr = title, label_en = title
        WHERE label_fr IS NULL
      `)
      // Set step_when_created from transaction's current step
      await db.rawQuery(`
        UPDATE conditions c
        SET step_when_created = COALESCE(
          (SELECT ws.step_order FROM transaction_steps ts
           JOIN workflow_steps ws ON ts.workflow_step_id = ws.id
           WHERE ts.id = c.transaction_step_id),
          1
        )
        WHERE step_when_created IS NULL
      `)
    })

    // Make level NOT NULL after backfill
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE conditions
        ALTER COLUMN level SET NOT NULL
      `)
    })

    // Create indexes
    this.schema.alterTable(this.tableName, (table) => {
      table.index(['transaction_id', 'archived', 'step_when_created'], 'idx_conditions_tx_archived')
      table.index(['transaction_id', 'archived_step'], 'idx_conditions_tx_archived_step')
      table.index(['transaction_id', 'status', 'level'], 'idx_conditions_tx_status_level')
      table.index(['template_id'], 'idx_conditions_template')
    })

    // Add CHECK constraint: blocking cannot be skipped_with_risk
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE conditions
        ADD CONSTRAINT chk_blocking_no_skip
        CHECK (NOT (level = 'blocking' AND resolution_type = 'skipped_with_risk'))
      `)
    })
  }

  async down() {
    // Remove CHECK constraint
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE conditions DROP CONSTRAINT IF EXISTS chk_blocking_no_skip
      `)
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['transaction_id', 'archived', 'step_when_created'], 'idx_conditions_tx_archived')
      table.dropIndex(['transaction_id', 'archived_step'], 'idx_conditions_tx_archived_step')
      table.dropIndex(['transaction_id', 'status', 'level'], 'idx_conditions_tx_status_level')
      table.dropIndex(['template_id'], 'idx_conditions_template')

      table.dropColumn('template_id')
      table.dropColumn('label_fr')
      table.dropColumn('label_en')
      table.dropColumn('level')
      table.dropColumn('source_type')
      table.dropColumn('resolution_type')
      table.dropColumn('resolution_note')
      table.dropColumn('resolved_at')
      table.dropColumn('resolved_by')
      table.dropColumn('archived')
      table.dropColumn('archived_at')
      table.dropColumn('archived_step')
      table.dropColumn('step_when_created')
      table.dropColumn('step_when_resolved')
    })
  }
}
