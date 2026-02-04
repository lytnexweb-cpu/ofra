import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration: Create transaction_condition_events table
 * Part of Conditions Engine Premium (D27)
 *
 * Audit trail complet - CRUCIAL POUR DEBUGGING ET LÉGAL
 */
export default class extends BaseSchema {
  protected tableName = 'transaction_condition_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Lien vers condition
      table.integer('condition_id').unsigned().notNullable()
        .references('id').inTable('conditions').onDelete('CASCADE')

      // Type d'événement
      table.string('event_type', 50).notNullable()

      // Acteur
      table.string('actor_id', 100).notNullable() // user_id ou 'system'

      // Métadonnées (old/new values, etc.)
      table.jsonb('meta').notNullable().defaultTo('{}')

      // Timestamp
      table.timestamp('created_at').notNullable().defaultTo(this.now())

      // Index
      table.index(['condition_id', 'created_at'], 'idx_events_condition_at')
      table.index(['event_type'], 'idx_events_type')
    })

    // Add CHECK constraint for valid event types
    this.defer(async (db) => {
      await db.rawQuery(`
        ALTER TABLE transaction_condition_events
        ADD CONSTRAINT chk_event_type
        CHECK (event_type IN (
          'created',
          'started',
          'resolved',
          'archived',
          'evidence_added',
          'evidence_removed',
          'note_added',
          'level_changed_admin',
          'unarchived_admin'
        ))
      `)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
