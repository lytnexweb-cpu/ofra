import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Transaction, { type TransactionStatus } from '#models/transaction'

export default class BackfillConditionStages extends BaseCommand {
  static commandName = 'backfill:condition-stages'
  static description = 'Backfill condition.stage based on status history at condition creation'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ description: 'Run in dry-run mode (no writes)' })
  declare dryRun: boolean

  @flags.number({ description: 'Batch size for processing', default: 100 })
  declare batchSize: number

  async run() {
    this.logger.info(`Starting backfill (dry-run: ${this.dryRun}, batch-size: ${this.batchSize})`)

    let updated = 0
    let skipped = 0
    let errors = 0
    const errorMessages: string[] = []

    try {
      // Get all transactions with their conditions and status histories
      const transactions = await Transaction.query()
        .preload('conditions')
        .preload('statusHistories', (query) => {
          query.orderBy('created_at', 'asc')
        })

      this.logger.info(`Processing ${transactions.length} transactions...`)

      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i]

        try {
          // Process each condition in this transaction
          for (const condition of transaction.conditions) {
            try {
              // Find the most recent statusHistory where createdAt <= condition.createdAt
              // CRITICAL: Use Luxon comparison with .toMillis()
              const relevantHistories = transaction.statusHistories.filter(
                (history) => history.createdAt.toMillis() <= condition.createdAt.toMillis()
              )

              let correctStage: TransactionStatus

              if (relevantHistories.length === 0) {
                // No history at condition creation time, fallback to transaction.status
                correctStage = transaction.status
              } else {
                // Use the most recent history's toStatus
                const mostRecentHistory = relevantHistories[relevantHistories.length - 1]
                correctStage = mostRecentHistory.toStatus
              }

              // Update condition.stage if it's different
              if (condition.stage !== correctStage) {
                if (!this.dryRun) {
                  condition.stage = correctStage
                  await condition.save()
                }
                updated++
              } else {
                skipped++
              }
            } catch (error) {
              errors++
              if (errorMessages.length < 10) {
                errorMessages.push(
                  `Condition ${condition.id} (Transaction ${transaction.id}): ${error instanceof Error ? error.message : 'Unknown error'}`
                )
              }
            }
          }

          // Progress logging every batch
          if ((i + 1) % this.batchSize === 0) {
            this.logger.info(
              `Progress: ${i + 1}/${transactions.length} (updated: ${updated}, skipped: ${skipped}, errors: ${errors})`
            )
          }
        } catch (error) {
          errors++
          if (errorMessages.length < 10) {
            errorMessages.push(
              `Transaction ${transaction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          }
        }
      }

      // Final summary
      this.logger.info('---')
      this.logger.info('Backfill Summary:')
      this.logger.info(`  Total transactions processed: ${transactions.length}`)
      this.logger.info(`  Updated: ${updated}`)
      this.logger.info(`  Skipped: ${skipped}`)
      this.logger.info(`  Errors: ${errors}`)

      if (errorMessages.length > 0) {
        this.logger.warning('First 10 errors:')
        errorMessages.forEach((msg) => this.logger.warning(`  - ${msg}`))
      }

      if (this.dryRun) {
        this.logger.info('(DRY RUN - no changes were made)')
      }
    } catch (error) {
      this.logger.error('Fatal error during backfill:')
      this.logger.error(error instanceof Error ? error.message : 'Unknown error')
      this.exitCode = 1
    }
  }
}