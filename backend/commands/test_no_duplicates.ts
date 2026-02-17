import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import { WorkflowEngineService } from '#services/workflow_engine_service'
import { ConditionsEngineService } from '#services/conditions_engine_service'
import TransactionProfile from '#models/transaction_profile'
import Condition from '#models/condition'


export default class TestNoDuplicates extends BaseCommand {
  static commandName = 'test:no-duplicates'
  static description = 'Create a test transaction and verify no duplicate conditions are created'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ description: 'Keep the test transaction (default: rollback)' })
  declare keep: boolean

  async run() {
    this.logger.info('=== TEST: No Duplicate Conditions ===')

    // Find required IDs
    const user = await db.from('users').select('id').first()
    const client = await db.from('clients').select('id').first()
    const template = await db.from('workflow_templates')
      .where('is_default', true)
      .select('id')
      .first()

    if (!user || !client || !template) {
      this.logger.error('Missing user, client, or template in DB')
      return
    }

    this.logger.info(`Using user=${user.id}, client=${client.id}, template=${template.id}`)

    let transactionId: number | null = null

    try {
      // Step 1: Create transaction (this triggers legacy condition creation for step 1)
      this.logger.info('')
      this.logger.info('Step 1: Creating transaction...')
      const transaction = await WorkflowEngineService.createTransactionFromTemplate({
        templateId: template.id,
        ownerUserId: user.id,
        organizationId: null,
        clientId: client.id,
        propertyId: null,
        type: 'purchase',
        salePrice: null,
        listPrice: null,
        commission: null,
        notesText: null,
        folderUrl: null,
      })
      transactionId = transaction.id
      this.logger.info(`  Created TX=${transactionId}`)

      const conditionsAfterCreate = await Condition.query().where('transactionId', transactionId)
      this.logger.info(`  Conditions after create: ${conditionsAfterCreate.length}`)

      // Step 2: Create profile (like frontend does)
      this.logger.info('')
      this.logger.info('Step 2: Creating transaction profile...')
      await TransactionProfile.create({
        transactionId,
        propertyType: 'house',
        propertyContext: 'rural',
        isFinanced: true,
        hasWell: true,
        hasSeptic: true,
        accessType: 'public',
        appraisalRequired: true,
      })
      this.logger.info('  Profile created (house, rural, financed)')

      // Step 3: Load condition pack (like frontend does after profile)
      this.logger.info('')
      this.logger.info('Step 3: Loading condition pack...')
      const packResult = await ConditionsEngineService.loadPackForTransaction(
        transactionId,
        user.id
      )
      this.logger.info(`  Pack loaded: ${packResult.loaded} conditions, by step: ${JSON.stringify(packResult.byStep)}`)

      const conditionsAfterPack = await Condition.query().where('transactionId', transactionId)
      this.logger.info(`  Total conditions after pack: ${conditionsAfterPack.length}`)

      // Step 4: Try loading pack AGAIN (should be idempotent)
      this.logger.info('')
      this.logger.info('Step 4: Loading pack again (idempotency test)...')
      const packResult2 = await ConditionsEngineService.loadPackForTransaction(
        transactionId,
        user.id
      )
      this.logger.info(`  Pack loaded: ${packResult2.loaded} conditions (should be 0)`)

      const conditionsAfterPack2 = await Condition.query().where('transactionId', transactionId)
      this.logger.info(`  Total conditions (should be same): ${conditionsAfterPack2.length}`)

      // Step 5: Simulate advancing to step 2 (createConditionsFromProfile)
      this.logger.info('')
      this.logger.info('Step 5: Simulating createConditionsFromProfile for step 2...')
      const steps = await db.from('transaction_steps')
        .where('transaction_id', transactionId)
        .where('step_order', 2)
        .first()

      if (steps) {
        const newConds = await ConditionsEngineService.createConditionsFromProfile(
          transactionId,
          steps.id,
          2,
          user.id
        )
        this.logger.info(`  Created ${newConds.length} conditions for step 2 (should skip those already loaded by pack)`)
      }

      const conditionsFinal = await Condition.query().where('transactionId', transactionId)
      this.logger.info(`  Final total conditions: ${conditionsFinal.length}`)

      // Step 6: Check for duplicates
      this.logger.info('')
      this.logger.info('=== DUPLICATE CHECK ===')
      const duplicates = await db.rawQuery(
        'SELECT title, transaction_step_id, COUNT(*) as cnt FROM conditions WHERE transaction_id = ? GROUP BY title, transaction_step_id HAVING COUNT(*) > 1',
        [transactionId]
      )

      if (duplicates.rows.length === 0) {
        this.logger.success('NO DUPLICATES FOUND — fix is working!')
      } else {
        this.logger.error(`FOUND ${duplicates.rows.length} DUPLICATE GROUPS:`)
        for (const dup of duplicates.rows) {
          this.logger.error(`  "${dup.title}" step_id=${dup.transaction_step_id} (${dup.cnt}x)`)
        }
      }

      // Also check by template_id
      const templateDups = await db.rawQuery(
        'SELECT template_id, COUNT(*) as cnt, MIN(title) as title FROM conditions WHERE transaction_id = ? AND template_id IS NOT NULL GROUP BY template_id HAVING COUNT(*) > 1',
        [transactionId]
      )

      if (templateDups.rows.length === 0) {
        this.logger.success('NO TEMPLATE-ID DUPLICATES — guard is working!')
      } else {
        this.logger.error(`FOUND ${templateDups.rows.length} TEMPLATE-ID DUPLICATE GROUPS:`)
        for (const dup of templateDups.rows) {
          this.logger.error(`  template=${dup.template_id} "${dup.title}" (${dup.cnt}x)`)
        }
      }

    } finally {
      // Cleanup: delete test transaction
      if (transactionId && !this.keep) {
        this.logger.info('')
        this.logger.info('Cleaning up test transaction...')
        await db.from('conditions').where('transaction_id', transactionId).delete()
        await db.from('transaction_steps').where('transaction_id', transactionId).delete()
        await db.from('transaction_profiles').where('transaction_id', transactionId).delete()
        await db.from('activity_feed').where('transaction_id', transactionId).delete()
        await db.from('transactions').where('id', transactionId).delete()
        this.logger.info(`  TX=${transactionId} deleted.`)
      } else if (transactionId) {
        this.logger.info(`  TX=${transactionId} kept (--keep flag).`)
      }
    }

    this.logger.info('')
    this.logger.success('Test complete.')
  }
}
