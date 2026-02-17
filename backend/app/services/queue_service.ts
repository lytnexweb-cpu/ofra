import { Queue, Worker, Job } from 'bullmq'
import queueConfig from '#config/queue'
import logger from '@adonisjs/core/services/logger'

export interface DailyDigestPayload {
  type: 'daily_digest'
  scheduledAt: string
}

export interface DeadlineWarningPayload {
  type: 'deadline_warning'
  conditionId: number
  transactionId: number
  dueDate: string
}

export interface DelayedAutomationPayload {
  type: 'delayed_automation'
  automationId: number
  transactionId: number
  stepName: string
  trigger: string
}

export interface TrialReminderPayload {
  type: 'trial_reminder'
  userId: number
  daysRemaining: number
}

export type ReminderPayload = DailyDigestPayload | DeadlineWarningPayload | TrialReminderPayload
export type JobPayload = ReminderPayload | DelayedAutomationPayload

class QueueService {
  private automationsQueue: Queue | null = null
  private remindersQueue: Queue | null = null
  private workers: Worker[] = []
  private isInitialized = false

  /**
   * Initialize queues and workers
   */
  async init() {
    if (this.isInitialized) return

    this.automationsQueue = new Queue(queueConfig.queues.automations, {
      connection: queueConfig.connection,
      defaultJobOptions: queueConfig.defaultJobOptions,
    })

    this.remindersQueue = new Queue(queueConfig.queues.reminders, {
      connection: queueConfig.connection,
      defaultJobOptions: queueConfig.defaultJobOptions,
    })

    logger.info('Queue service initialized')
    this.isInitialized = true
  }

  /**
   * Start processing jobs
   */
  async startWorkers(handlers: {
    processAutomation: (job: Job<DelayedAutomationPayload>) => Promise<void>
    processReminder: (job: Job<ReminderPayload>) => Promise<void>
  }) {
    const automationWorker = new Worker<DelayedAutomationPayload>(
      queueConfig.queues.automations,
      async (job) => {
        logger.info({ jobId: job.id, type: job.data.type }, 'Processing automation job')
        await handlers.processAutomation(job)
      },
      { connection: queueConfig.connection }
    )

    const reminderWorker = new Worker<ReminderPayload>(
      queueConfig.queues.reminders,
      async (job) => {
        logger.info({ jobId: job.id, type: job.data.type }, 'Processing reminder job')
        await handlers.processReminder(job)
      },
      { connection: queueConfig.connection }
    )

    // Error handlers
    automationWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Automation job failed')
    })

    reminderWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Reminder job failed')
    })

    automationWorker.on('completed', (job) => {
      logger.info({ jobId: job.id }, 'Automation job completed')
    })

    reminderWorker.on('completed', (job) => {
      logger.info({ jobId: job.id }, 'Reminder job completed')
    })

    this.workers.push(automationWorker, reminderWorker)
    logger.info('Queue workers started')
  }

  /**
   * Schedule a delayed automation
   */
  async scheduleDelayedAutomation(payload: Omit<DelayedAutomationPayload, 'type'>, delayMs: number) {
    if (!this.automationsQueue) {
      throw new Error('Queue not initialized')
    }

    const job = await this.automationsQueue.add(
      'delayed_automation',
      { ...payload, type: 'delayed_automation' as const },
      { delay: delayMs }
    )

    logger.info({ jobId: job.id, delayMs }, 'Delayed automation scheduled')
    return job
  }

  /**
   * Schedule a deadline warning
   */
  async scheduleDeadlineWarning(payload: Omit<DeadlineWarningPayload, 'type'>, delayMs: number) {
    if (!this.remindersQueue) {
      throw new Error('Queue not initialized')
    }

    // Use a unique job ID to prevent duplicates
    const jobId = `deadline-${payload.conditionId}-${payload.dueDate}`

    const job = await this.remindersQueue.add(
      'deadline_warning',
      { ...payload, type: 'deadline_warning' as const },
      { delay: delayMs, jobId }
    )

    logger.info({ jobId: job.id, delayMs }, 'Deadline warning scheduled')
    return job
  }

  /**
   * D53: Schedule a trial reminder email
   */
  async scheduleTrialReminder(payload: Omit<TrialReminderPayload, 'type'>, delayMs: number) {
    if (!this.remindersQueue) {
      throw new Error('Queue not initialized')
    }

    const jobId = `trial-reminder-${payload.userId}-j${30 - payload.daysRemaining}`

    const job = await this.remindersQueue.add(
      'trial_reminder',
      { ...payload, type: 'trial_reminder' as const },
      { delay: delayMs, jobId }
    )

    logger.info({ jobId: job.id, delayMs, daysRemaining: payload.daysRemaining }, 'Trial reminder scheduled')
    return job
  }

  /**
   * Schedule daily digest (repeatable job)
   */
  async scheduleDailyDigest() {
    if (!this.remindersQueue) {
      throw new Error('Queue not initialized')
    }

    // Remove existing repeatable job if any
    const repeatableJobs = await this.remindersQueue.getRepeatableJobs()
    for (const job of repeatableJobs) {
      if (job.name === 'daily_digest') {
        await this.remindersQueue.removeRepeatableByKey(job.key)
      }
    }

    // Schedule daily at 08:00 Atlantic Time (UTC-4 = 12:00 UTC)
    // In winter (AST), Atlantic is UTC-4
    // In summer (ADT), Atlantic is UTC-3
    // We use 12:00 UTC as a reasonable approximation for 08:00 Atlantic
    const job = await this.remindersQueue.add(
      'daily_digest',
      { type: 'daily_digest' as const, scheduledAt: new Date().toISOString() },
      {
        repeat: {
          pattern: '0 12 * * *', // 12:00 UTC = ~08:00 Atlantic
        },
      }
    )

    logger.info({ jobId: job.id }, 'Daily digest scheduled (08:00 Atlantic / 12:00 UTC)')
    return job
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    for (const worker of this.workers) {
      await worker.close()
    }
    await this.automationsQueue?.close()
    await this.remindersQueue?.close()
    logger.info('Queue service shut down')
  }

  /**
   * Get queue for testing/debugging
   */
  getAutomationsQueue() {
    return this.automationsQueue
  }

  getRemindersQueue() {
    return this.remindersQueue
  }
}

export const queueService = new QueueService()
