/**
 * Queue Worker and Scheduler
 *
 * This file initializes the BullMQ queues and workers for:
 * - Daily digest emails (08:00 Atlantic Time)
 * - 48h deadline warnings
 * - Delayed automations (e.g., Google review 7 days after closing)
 *
 * This file is preloaded by AdonisJS and starts the queue system automatically.
 */

import env from '#start/env'
import { queueService } from '#services/queue_service'
import { ReminderService } from '#services/reminder_service'
import { AutomationExecutorService } from '#services/automation_executor_service'
import WorkflowStepAutomation from '#models/workflow_step_automation'
import logger from '@adonisjs/core/services/logger'
import type { Job } from 'bullmq'
import type { DelayedAutomationPayload, DailyDigestPayload, DeadlineWarningPayload } from '#services/queue_service'

/**
 * Initialize and start the queue system
 */
export async function startQueueSystem() {
  try {
    // Initialize queues
    await queueService.init()

    // Start workers with handlers
    await queueService.startWorkers({
      processAutomation: async (job: Job<DelayedAutomationPayload>) => {
        const { automationId, transactionId, stepName, trigger } = job.data

        const automation = await WorkflowStepAutomation.find(automationId)
        if (!automation) {
          logger.warn({ automationId }, 'Automation not found - skipping')
          return
        }

        await AutomationExecutorService.execute(automation, transactionId, {
          stepName,
          trigger,
        })
      },

      processReminder: async (job: Job<DailyDigestPayload | DeadlineWarningPayload | { type: 'hourly_check' }>) => {
        if (job.data.type === 'daily_digest') {
          await ReminderService.processDailyDigest(job as Job<DailyDigestPayload>)
        } else if (job.data.type === 'deadline_warning') {
          await ReminderService.processDeadlineWarning(job as Job<DeadlineWarningPayload>)
        } else if (job.data.type === 'hourly_check') {
          // Schedule warnings for conditions due in ~48h
          await ReminderService.scheduleUpcomingWarnings()
        }
      },
    })

    // Schedule daily digest
    await queueService.scheduleDailyDigest()

    // Schedule hourly check for upcoming deadlines
    await scheduleHourlyDeadlineCheck()

    logger.info('Queue system started successfully')
  } catch (err) {
    logger.error({ err }, 'Failed to start queue system')
    throw err
  }
}

/**
 * Schedule hourly deadline checks using a repeatable job
 */
async function scheduleHourlyDeadlineCheck() {
  const remindersQueue = queueService.getRemindersQueue()
  if (!remindersQueue) return

  // Remove existing repeatable job if any
  const repeatableJobs = await remindersQueue.getRepeatableJobs()
  for (const job of repeatableJobs) {
    if (job.name === 'hourly_deadline_check') {
      await remindersQueue.removeRepeatableByKey(job.key)
    }
  }

  // Add hourly check job
  await remindersQueue.add(
    'hourly_deadline_check',
    { type: 'hourly_check' as const },
    {
      repeat: {
        pattern: '0 * * * *', // Every hour at minute 0
      },
    }
  )

  logger.info('Hourly deadline check scheduled')
}

/**
 * Graceful shutdown
 */
export async function stopQueueSystem() {
  await queueService.shutdown()
  logger.info('Queue system stopped')
}

/**
 * Auto-start queue system when this file is preloaded
 * Only runs in web environment (not during tests or console commands)
 */
const shouldStartQueue = env.get('NODE_ENV') !== 'test' && env.get('QUEUE_ENABLED', 'true') === 'true'

if (shouldStartQueue) {
  // Delay startup to ensure all services are ready
  setTimeout(() => {
    startQueueSystem().catch((err) => {
      logger.error({ err }, 'Failed to auto-start queue system')
    })
  }, 2000)
}
