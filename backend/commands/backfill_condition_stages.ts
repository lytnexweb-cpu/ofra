import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Transaction, { type TransactionStatus } from '#models/transaction'
import Condition from '#models/condition'
import fs from 'node:fs/promises'
import { DateTime } from 'luxon'

interface Checkpoint {
  lastProcessedId: number
  startTime: string
  totalProcessed: number
  updated: number
  skipped: number
  errors: number
}

export default class BackfillConditionStages extends BaseCommand {
  static commandName = 'backfill:condition-stages'
  static description = 'Backfill condition.stage based on status history at condition creation (suspect conditions only)'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ description: 'Run in dry-run mode (no writes)' })
  declare dryRun: boolean

  @flags.number({ description: 'Batch size for processing (default: 50, max: 200)', default: 50 })
  declare batchSize: number

  @flags.number({ description: 'Start from condition ID (optional)' })
  declare startId?: number

  @flags.number({ description: 'Stop at condition ID (optional)' })
  declare endId?: number

  @flags.boolean({ description: 'Resume from last checkpoint' })
  declare resume: boolean

  @flags.number({ description: 'Max errors before stopping (default: 100)', default: 100 })
  declare maxErrors: number

  @flags.number({ description: 'Throttle delay between batches in ms (default: 100)', default: 100 })
  declare throttleMs: number

  private checkpointFile = 'backfill_condition_stages_checkpoint.json'

  async run() {
    const startTime = DateTime.now()
    this.logger.info('='.repeat(80))
    this.logger.info(`Backfill Condition Stages - Started at ${startTime.toISO()}`)
    this.logger.info(`Config: dry-run=${this.dryRun}, batch=${this.batchSize}, throttle=${this.throttleMs}ms, max-errors=${this.maxErrors}`)
    this.logger.info('='.repeat(80))

    let updated = 0
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
        updated = checkpoint.updated
        skipped = checkpoint.skipped
        errors = checkpoint.errors
        this.logger.info(`📍 Resuming from checkpoint: lastId=${lastProcessedId}, processed=${totalProcessed}`)
      } else {
        this.logger.warning('⚠️  No checkpoint found, starting fresh')
      }
    }

    // Validate batch size
    if (this.batchSize > 200) {
      this.logger.warning(`⚠️  Batch size ${this.batchSize} too high, capping at 200`)
      this.batchSize = 200
    }

    // Count suspect conditions first
    const suspectCountQuery = Condition.query()
      .whereIn('stage', ['conditions'])
      .orWhereNull('stage')

    if (this.startId) {
      suspectCountQuery.where('id', '>', this.startId)
    }
    if (this.endId) {
      suspectCountQuery.where('id', '<=', this.endId)
    }

    const suspectCount = await suspectCountQuery.count('* as total')
    const totalSuspect = Number(suspectCount[0].$extras.total)

    this.logger.info(`🔍 Found ${totalSuspect} suspect conditions (stage='conditions' or null)`)

    if (totalSuspect === 0) {
      this.logger.info('✅ No suspect conditions found, nothing to backfill')
      return
    }

    try {
      let hasMore = true
      let batchNumber = 0
      const batchStartTime = DateTime.now()

      while (hasMore) {
        batchNumber++
        const batchStart = DateTime.now()

        // Cursor-based query: fetch next batch of SUSPECT conditions only
        const query = Condition.query()
          .where('id', '>', lastProcessedId)
          .where((subQuery) => {
            subQuery.where('stage', 'conditions').orWhereNull('stage')
          })
          .orderBy('id', 'asc')
          .limit(this.batchSize)

        if (this.endId) {
          query.where('id', '<=', this.endId)
        }

        const conditions = await query

        if (conditions.length === 0) {
          hasMore = false
          break
        }

        // Group conditions by transaction_id for efficient loading
        const transactionIds = [...new Set(conditions.map((c) => c.transactionId))]

        // Load all relevant transactions with their status histories in one query
        const transactions = await Transaction.query()
          .whereIn('id', transactionIds)
          .preload('statusHistories', (query) => {
            query.orderBy('created_at', 'asc')
          })

        // Create a map for quick lookup
        const transactionMap = new Map(transactions.map((t) => [t.id, t]))

        // Process each condition
        for (const condition of conditions) {
          try {
            const transaction = transactionMap.get(condition.transactionId)

            if (!transaction) {
              errors++
              const errorKey = 'Transaction not found'
              const existing = errorMessages.get(errorKey)
              if (existing) {
                existing.count++
              } else {
                errorMessages.set(errorKey, {
                  count: 1,
                  sample: `Condition ${condition.id}`,
                })
              }
              totalProcessed++
              lastProcessedId = condition.id
              continue
            }

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

            totalProcessed++
            lastProcessedId = condition.id
          } catch (error) {
            errors++
            const errorKey = error instanceof Error ? error.message : 'Unknown error'
            const existing = errorMessages.get(errorKey)
            if (existing) {
              existing.count++
            } else {
              errorMessages.set(errorKey, {
                count: 1,
                sample: `Condition ${condition.id}`,
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
        const throughput = (conditions.length / batchDuration) * 1000

        // Progress logging with percentage
        const elapsed = DateTime.now().diff(batchStartTime).as('seconds')
        const percentComplete = ((totalProcessed / totalSuspect) * 100).toFixed(1)
        const eta = totalProcessed > 0 ? ((totalSuspect - totalProcessed) / (totalProcessed / elapsed)).toFixed(0) : '?'

        this.logger.info(
          `Batch ${batchNumber}: processed ${conditions.length} conditions in ${batchDuration.toFixed(0)}ms (${throughput.toFixed(1)} c/s) | ` +
            `Total: ${totalProcessed}/${totalSuspect} (${percentComplete}%) | Updated: ${updated} | Skipped: ${skipped} | Errors: ${errors} | ETA: ${eta}s | LastId: ${lastProcessedId}`
        )

        // Save checkpoint
        await this.saveCheckpoint({
          lastProcessedId,
          startTime: startTime.toISO()!,
          totalProcessed,
          updated,
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
      this.logger.info(`  Updated: ${updated}`)
      this.logger.info(`  Skipped: ${skipped}`)
      this.logger.info(`  Errors: ${errors}`)
      this.logger.info(`  Throughput: ${(totalProcessed / totalDuration).toFixed(1)} conditions/s`)

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