import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Condition from '#models/condition'
import ConditionTemplate from '#models/condition_template'

export default class CheckConditions extends BaseCommand {
  static commandName = 'check:conditions'
  static description = 'Audit conditions and templates'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('=== AUDIT CONDITIONS ===')

    // Check conditions for TX 13
    const conditions = await Condition.query().where('transactionId', 13).orderBy('id', 'asc')
    this.logger.info(`TX=13 has ${conditions.length} conditions:`)
    for (const c of conditions) {
      this.logger.info(`  ID=${c.id} templateId=${c.templateId ?? 'NULL'} labelFr="${c.labelFr}" level=${c.level} step=${c.stepWhenCreated}`)
    }

    // Check for duplicates by labelFr
    this.logger.info('')
    this.logger.info('=== DUPLICATE CHECK ===')
    const labelCounts = new Map<string, number>()
    for (const c of conditions) {
      const key = `${c.labelFr}|${c.stepWhenCreated}`
      labelCounts.set(key, (labelCounts.get(key) || 0) + 1)
    }
    for (const [key, count] of labelCounts) {
      if (count > 1) {
        this.logger.warning(`DUPLICATE: "${key}" appears ${count} times`)
      }
    }

    // Check templates for step 2
    this.logger.info('')
    this.logger.info('=== TEMPLATES FOR STEP 2 ===')
    const templates = await ConditionTemplate.query()
      .where('step', 2)
      .where('isActive', true)
      .where('isDefault', true)
      .orderBy('id', 'asc')
    this.logger.info(`Found ${templates.length} templates for step 2:`)
    for (const t of templates) {
      this.logger.info(`  ID=${t.id} labelFr="${t.labelFr}" pack=${t.pack} level=${t.level}`)
    }
  }
}
