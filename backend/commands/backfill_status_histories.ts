import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Transaction, { type TransactionStatus } from '#models/transaction'
import TransactionStatusHistory from '#models/transaction_status_history'
import fs from 'node:fs/promises'
import { DateTime } from 'luxon'

interface Checkpoint {
  lastProcessedId: number
  startTime: string
  totalProcessed: number
  created: number
  skipped: number
  errors: number
}

export default class BackfillStatusHistories extends BaseCommand {
  static commandName = 'backfill:status-histories'
  static description = 'Create initial statusHistory for transactions missing it (cursor-based batching)'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ description: 'Run in dry-run mode (no writes)' })
  declare dryRun: boolean

  @flags.number({ description: 'Batch size for processing (default: 100, max: 500)', default: 100 })
  declare batchSize: number

  @flags.number({ description: 'Start from transaction ID (optional)' })
  declare startId?: number

  @flags.number({ description: 'Stop at transaction ID (optional)' })
  declare endId?: number

  @flags.boolean({ description: 'Resume from last checkpoint' })
  declare resume: boolean

  @flags.number({ description: 'Max errors before stopping (default: 100)', default: 100 })
  declare maxErrors: number

  @flags.number({ description: 'Throttle delay between batches in ms (default: 100)', default: 100 })
  declare throttleMs: number

  private checkpointFile = 'backfill_status_histories_checkpoint.json'

  async run() {
    const startTime = DateTime.now()
    this.logger.info('='.repeat(80))
    this.logger.info(`Backfill Status Histories - Started at ${startTime.toISO()}`)
    this.logger.info(`Config: dry-run=${this.dryRun}, batch=${this.batchSize}, throttle=${this.throttleMs}ms, max-errors=${this.maxErrors}`)
    this.logger.info('='.repeat(80))

    let created = 0
    let skipped = 0
    let errors = 0
    const errorMessages: Map<string, { count: number; sample: string }> = new Map()
    let lastProcessedId = this.startId ?? 0
    let totalProcessed = 0

    // Resume from checkpoint if requested
    if (this.resume) {
      const checkpoint = await this.loadCheckpoint()
      if (checkpoint) {
        lastProcessedId = checkpoint.lastProcessedId
        totalProcessed = checkpoint.totalProcessed
        created = checkpoint.created
        skipped = checkpoint.skipped
        errors = checkpoint.errors
        this.logger.info(`📍 Resuming from checkpoint: lastId=${lastProcessedId}, processed=${totalProcessed}`)
      } else {
        this.logger.warning('⚠️  No checkpoint found, starting fresh')
      }
    }

    // Validate batch size
    if (this.batchSize > 500) {
      this.logger.warning(`⚠️  Batch size ${this.batchSize} too high, capping at 500`)
      this.batchSize = 500
    }

    try {
      let hasMore = true
      let batchNumber = 0

      while (hasMore) {
        batchNumber++
        const batchStart = DateTime.now()

        // Cursor-based query: fetch next batch of transactions
        const query = Transaction.query()
          .where('id', '>', lastProcessedId)
          .orderBy('id', 'asc')
          .limit(this.batchSize)

        if (this.endId) {
          query.where('id', '<=', this.endId)
        }

        const transactions = await query

        if (transactions.length === 0) {
          hasMore = false
          break
        }

        // Process batch
        for (const transaction of transactions) {
          try {
            // Load status histories for this transaction only
            await transaction.load('statusHistories', (query) => {
              query.orderBy('created_at', 'asc')
            })

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

            totalProcessed++
            lastProcessedId = transaction.id
          } catch (error) {
            errors++
            const errorKey = error instanceof Error ? error.message : 'Unknown error'
            const existing = errorMessages.get(errorKey)
            if (existing) {
              existing.count++
            } else {
              errorMessages.set(errorKey, {
                count: 1,
                sample: `Transaction ${transaction.id}`,
              })
            }

            // Stop if too many errors
            if (errors >= this.maxErrors) {
              this.logger.error(`❌ Reached max errors (${this.maxErrors}), stopping`)
              hasMore = false
              break
            }
          }
        }

        const batchDuration = DateTime.now().diff(batchStart).as('milliseconds')
        const throughput = (transactions.length / batchDuration) * 1000

        // Progress logging
        this.logger.info(
          `Batch ${batchNumber}: processed ${transactions.length} tx in ${batchDuration.toFixed(0)}ms (${throughput.toFixed(1)} tx/s) | ` +
            `Total: ${totalProcessed} | Created: ${created} | Skipped: ${skipped} | Errors: ${errors} | LastId: ${lastProcessedId}`
        )

        // Save checkpoint
        await this.saveCheckpoint({
          lastProcessedId,
          startTime: startTime.toISO()!,
          totalProcessed,
          created,
          skipped,
          errors,
        })

        // Throttle between batches
        if (hasMore && this.throttleMs > 0) {
          await this.sleep(this.throttleMs)
        }
      }

      // Final summary
      const totalDuration = DateTime.now().diff(startTime).as('seconds')
      this.logger.info('='.repeat(80))
      this.logger.info('✅ Backfill Summary:')
      this.logger.info(`  Duration: ${totalDuration.toFixed(1)}s`)
      this.logger.info(`  Total processed: ${totalProcessed}`)
      this.logger.info(`  Created: ${created}`)
      this.logger.info(`  Skipped: ${skipped}`)
      this.logger.info(`  Errors: ${errors}`)
      this.logger.info(`  Throughput: ${(totalProcessed / totalDuration).toFixed(1)} tx/s`)

      if (errorMessages.size > 0) {
        this.logger.warning(`\n⚠️  Error Summary (${errorMessages.size} unique error types):`)
        const sortedErrors = Array.from(errorMessages.entries()).sort((a, b) => b[1].count - a[1].count)
        sortedErrors.slice(0, 20).forEach(([msg, data]) => {
          this.logger.warning(`  [${data.count}×] ${msg} (sample: ${data.sample})`)
        })
      }

      if (this.dryRun) {
        this.logger.info('\n🔍 DRY RUN - no changes were made')
      }

      this.logger.info('='.repeat(80))

      // Cleanup checkpoint on success
      if (!this.dryRun && errors === 0) {
        await this.deleteCheckpoint()
      }
    } catch (error) {
      this.logger.error('💥 Fatal error during backfill:')
      this.logger.error(error instanceof Error ? error.message : 'Unknown error')
      if (error instanceof Error && error.stack) {
        this.logger.error(error.stack)
      }
      this.exitCode = 1
    }
  }

  private async loadCheckpoint(): Promise<Checkpoint | null> {
    try {
      const content = await fs.readFile(this.checkpointFile, 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  private async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    if (this.dryRun) return
    await fs.writeFile(this.checkpointFile, JSON.stringify(checkpoint, null, 2))
  }

  private async deleteCheckpoint(): Promise<void> {
    try {
      await fs.unlink(this.checkpointFile)
    } catch {
      // Ignore if doesn't exist
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}