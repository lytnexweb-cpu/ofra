import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration: Add deadline fields to condition_templates
 * Part of D37 - Deadlines relatives dans templates
 *
 * Allows templates to define relative deadlines that get calculated
 * when creating conditions from templates.
 */
export default class extends BaseSchema {
  protected tableName = 'condition_templates'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Reference point for deadline calculation
      // 'acceptance' = from offer acceptance date
      // 'closing' = from closing date (countdown)
      // 'step_start' = from when the step starts
      table
        .enum('deadline_reference', ['acceptance', 'closing', 'step_start'])
        .nullable()
        .defaultTo(null)

      // Number of days from reference point
      // Positive = after reference, Negative = before (for closing countdown)
      table.integer('default_deadline_days').nullable().defaultTo(null)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('deadline_reference')
      table.dropColumn('default_deadline_days')
    })
  }
}
