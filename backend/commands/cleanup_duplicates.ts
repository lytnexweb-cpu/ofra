import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'

export default class CleanupDuplicates extends BaseCommand {
  static commandName = 'cleanup:duplicates'
  static description = 'Remove duplicate templates and conditions'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('=== CLEANUP DUPLICATES ===')

    // Step 1: Find duplicate templates (same label_fr, step, pack)
    this.logger.info('')
    this.logger.info('Step 1: Finding duplicate templates...')

    const duplicateTemplates = await db.rawQuery(`
      SELECT label_fr, step, pack, COUNT(*) as cnt,
             MIN(id) as keep_id,
             STRING_AGG(id::text, ',') as all_ids
      FROM condition_templates
      WHERE is_active = true AND is_default = true
      GROUP BY label_fr, step, pack
      HAVING COUNT(*) > 1
    `)

    if (duplicateTemplates.rows.length === 0) {
      this.logger.success('No duplicate templates found!')
    } else {
      this.logger.warning(`Found ${duplicateTemplates.rows.length} duplicate template groups`)

      for (const dup of duplicateTemplates.rows) {
        const allIds = String(dup.all_ids).split(',').map(Number)
        const keepId = dup.keep_id
        const deleteIds = allIds.filter((id: number) => id !== keepId)

        this.logger.info(`  "${dup.label_fr}" step=${dup.step}: keeping ${keepId}, deleting ${deleteIds.join(', ')}`)

        // Delete duplicate templates
        await db.from('condition_templates').whereIn('id', deleteIds).delete()

        // Delete conditions linked to deleted templates
        const deletedConditions = await db.from('conditions').whereIn('template_id', deleteIds).delete()
        this.logger.info(`    Deleted ${deletedConditions} conditions linked to duplicate templates`)
      }
    }

    // Step 2: Find duplicate conditions (same label_fr, transaction_id, step)
    this.logger.info('')
    this.logger.info('Step 2: Finding remaining duplicate conditions...')

    const duplicateConditions = await db.rawQuery(`
      SELECT label_fr, transaction_id, step_when_created, COUNT(*) as cnt,
             MIN(id) as keep_id,
             STRING_AGG(id::text, ',') as all_ids
      FROM conditions
      GROUP BY label_fr, transaction_id, step_when_created
      HAVING COUNT(*) > 1
    `)

    if (duplicateConditions.rows.length === 0) {
      this.logger.success('No duplicate conditions found!')
    } else {
      this.logger.warning(`Found ${duplicateConditions.rows.length} duplicate condition groups`)

      for (const dup of duplicateConditions.rows) {
        const allIds = String(dup.all_ids).split(',').map(Number)
        const keepId = dup.keep_id
        const deleteIds = allIds.filter((id: number) => id !== keepId)

        this.logger.info(`  TX=${dup.transaction_id} "${dup.label_fr}": keeping ${keepId}, deleting ${deleteIds.join(', ')}`)

        // Delete duplicate conditions (cascade should handle related tables)
        await db.from('conditions').whereIn('id', deleteIds).delete()
      }
    }

    this.logger.info('')
    this.logger.success('Cleanup complete!')
  }
}
