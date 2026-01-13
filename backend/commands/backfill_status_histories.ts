import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Transaction, { type TransactionStatus } from '#models/transaction'
import TransactionStatusHistory from '#models/transaction_status_history'

export default class BackfillStatusHistories extends BaseCommand {
  static commandName = 'backfill:status-histories'
  static description = 'Create initial statusHistory for transactions missing it'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ description: 'Run in dry-run mode (no writes)' })
  declare dryRun: boolean

  @flags.number({ description: 'Batch size for processing', default: 100 })
  declare batchSize: number

  async run() {
    this.logger.info(`Starting backfill (dry-run: ${this.dryRun}, batch-size: ${this.batchSize})`)

    let created = 0
    let skipped = 0
    let errors = 0
    const errorMessages: string[] = []

    try {
      // Get all transactions with their status histories
      const transactions = await Transaction.query().preload('statusHistories', (query) => {
        query.orderBy('created_at', 'asc')
      })

      this.logger.info(`Processing ${transactions.length} transactions...`)

      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i]

        try {
          // Check if initial history exists (fromStatus === null)
          const hasInitialHistory = transaction.statusHistories.some(
            (history) => history.fromStatus === null
          )

          if (hasInitialHistory) {
            skipped++
          } else {
            // Determine toStatus for initial history
            let toStatus: TransactionStatus
            if (transaction.statusHistories.length === 0) {
              toStatus = transaction.status
            } else {
              const earliestHistory = transaction.statusHistories[0]
              toStatus = earliestHistory.fromStatus ?? transaction.status
            }

            if (!this.dryRun) {
              // Create initial history entry
              await TransactionStatusHistory.create({
                transactionId: transaction.id,
                fromStatus: null,
                toStatus: toStatus,
                createdAt: transaction.createdAt,
              })
            }

            created++
          }

          // Progress logging every batch
          if ((i + 1) % this.batchSize === 0) {
            this.logger.info(
              `Progress: ${i + 1}/${transactions.length} (created: ${created}, skipped: ${skipped}, errors: ${errors})`
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
      this.logger.info(`  Total processed: ${transactions.length}`)
      this.logger.info(`  Created: ${created}`)
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