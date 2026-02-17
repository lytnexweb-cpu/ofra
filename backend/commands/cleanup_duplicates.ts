import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'

export default class CleanupDuplicates extends BaseCommand {
  static commandName = 'cleanup:duplicates'
  static description = 'Find and remove duplicate conditions. Dry run by default.'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ description: 'Actually delete duplicates (default: dry run only)' })
  declare execute: boolean

  async run() {
    const dryRun = !this.execute

    this.logger.info('=== CLEANUP DUPLICATE CONDITIONS ===')
    if (dryRun) {
      this.logger.warning('DRY RUN — nothing will be deleted. Use --execute to delete.')
    } else {
      this.logger.warning('EXECUTE MODE — duplicates will be deleted!')
    }

    // ── Step 1: Duplicate templates (same label_fr + step + pack) ──
    this.logger.info('')
    this.logger.info('Step 1: Finding duplicate templates...')

    const duplicateTemplates = await db.rawQuery(`
      SELECT label_fr, step, pack, COUNT(*) as cnt,
             MIN(id) as keep_id,
             STRING_AGG(id::text, ',' ORDER BY id) as all_ids
      FROM condition_templates
      WHERE is_active = true AND is_default = true
      GROUP BY label_fr, step, pack
      HAVING COUNT(*) > 1
    `)

    if (duplicateTemplates.rows.length === 0) {
      this.logger.success('No duplicate templates found.')
    } else {
      this.logger.warning(`Found ${duplicateTemplates.rows.length} duplicate template groups:`)

      let templateConditionsDeleted = 0

      for (const dup of duplicateTemplates.rows) {
        const allIds = String(dup.all_ids).split(',').map(Number)
        const keepId = dup.keep_id
        const deleteIds = allIds.filter((id: number) => id !== keepId)

        this.logger.info(`  "${dup.label_fr}" step=${dup.step} pack=${dup.pack}`)
        this.logger.info(`    KEEP id=${keepId}, DELETE ids=[${deleteIds.join(', ')}]`)

        if (!dryRun) {
          // Delete conditions linked to duplicate templates (CASCADE handles events/evidence)
          const deletedConds = await db.from('conditions').whereIn('template_id', deleteIds).delete()
          templateConditionsDeleted += Array.isArray(deletedConds) ? deletedConds[0] : deletedConds

          await db.from('condition_templates').whereIn('id', deleteIds).delete()
          this.logger.info(`    Deleted ${deleteIds.length} templates + ${deletedConds} conditions`)
        }
      }

      if (dryRun) {
        this.logger.info(`  → Would clean ${duplicateTemplates.rows.length} template groups`)
      }
    }

    // ── Step 2: Duplicate conditions (same title + transaction_id + transaction_step_id) ──
    this.logger.info('')
    this.logger.info('Step 2: Finding duplicate conditions (same title + transaction + step)...')

    const duplicateConditions = await db.rawQuery(`
      SELECT title, transaction_id, transaction_step_id, COUNT(*) as cnt,
             MIN(id) as keep_id,
             STRING_AGG(id::text, ',' ORDER BY id) as all_ids
      FROM conditions
      GROUP BY title, transaction_id, transaction_step_id
      HAVING COUNT(*) > 1
      ORDER BY transaction_id, transaction_step_id
    `)

    if (duplicateConditions.rows.length === 0) {
      this.logger.success('No duplicate conditions found.')
    } else {
      this.logger.warning(`Found ${duplicateConditions.rows.length} duplicate condition groups:`)

      let totalDeleted = 0

      for (const dup of duplicateConditions.rows) {
        const allIds = String(dup.all_ids).split(',').map(Number)
        const keepId = dup.keep_id
        const deleteIds = allIds.filter((id: number) => id !== keepId)

        this.logger.info(
          `  TX=${dup.transaction_id} step_id=${dup.transaction_step_id} "${dup.title}" (${dup.cnt}x)`
        )
        this.logger.info(`    KEEP id=${keepId}, DELETE ids=[${deleteIds.join(', ')}]`)

        if (!dryRun) {
          // Delete duplicate conditions (CASCADE handles events/evidence)
          await db.from('conditions').whereIn('id', deleteIds).delete()
          totalDeleted += deleteIds.length
        }
      }

      if (dryRun) {
        const totalToDelete = duplicateConditions.rows.reduce(
          (sum: number, dup: any) => sum + (dup.cnt - 1),
          0
        )
        this.logger.info(`  → Would delete ${totalToDelete} duplicate conditions (keeping 1 per group)`)
      } else {
        this.logger.success(`Deleted ${totalDeleted} duplicate conditions.`)
      }
    }

    // ── Step 3: Also check for template_id duplicates (same template_id + transaction_id) ──
    this.logger.info('')
    this.logger.info('Step 3: Finding duplicate template-based conditions (same template_id + transaction)...')

    const duplicateByTemplate = await db.rawQuery(`
      SELECT template_id, transaction_id, COUNT(*) as cnt,
             MIN(id) as keep_id,
             STRING_AGG(id::text, ',' ORDER BY id) as all_ids,
             MIN(title) as title
      FROM conditions
      WHERE template_id IS NOT NULL
      GROUP BY template_id, transaction_id
      HAVING COUNT(*) > 1
      ORDER BY transaction_id
    `)

    if (duplicateByTemplate.rows.length === 0) {
      this.logger.success('No duplicate template-based conditions found.')
    } else {
      this.logger.warning(`Found ${duplicateByTemplate.rows.length} duplicate template-condition groups:`)

      let totalDeleted = 0

      for (const dup of duplicateByTemplate.rows) {
        const allIds = String(dup.all_ids).split(',').map(Number)
        const keepId = dup.keep_id
        const deleteIds = allIds.filter((id: number) => id !== keepId)

        this.logger.info(
          `  TX=${dup.transaction_id} template=${dup.template_id} "${dup.title}" (${dup.cnt}x)`
        )
        this.logger.info(`    KEEP id=${keepId}, DELETE ids=[${deleteIds.join(', ')}]`)

        if (!dryRun) {
          await db.from('condition_events').whereIn('condition_id', deleteIds).delete()
          await db.from('condition_evidences').whereIn('condition_id', deleteIds).delete()
          await db.from('conditions').whereIn('id', deleteIds).delete()
          totalDeleted += deleteIds.length
        }
      }

      if (dryRun) {
        const totalToDelete = duplicateByTemplate.rows.reduce(
          (sum: number, dup: any) => sum + (dup.cnt - 1),
          0
        )
        this.logger.info(`  → Would delete ${totalToDelete} duplicate template conditions`)
      } else {
        this.logger.success(`Deleted ${totalDeleted} duplicate template conditions.`)
      }
    }

    this.logger.info('')
    if (dryRun) {
      this.logger.warning('DRY RUN complete. Run with --execute to apply changes.')
    } else {
      this.logger.success('Cleanup complete!')
    }
  }
}
