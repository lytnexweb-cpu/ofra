import { Job } from 'bullmq'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import logger from '@adonisjs/core/services/logger'
import User from '#models/user'
import Condition from '#models/condition'
import Transaction from '#models/transaction'
import DailyDigestMail from '#mails/daily_digest_mail'
import DeadlineWarningMail from '#mails/deadline_warning_mail'
import { DailyDigestPayload, DeadlineWarningPayload } from '#services/queue_service'

interface ConditionWithTransaction {
  id: number
  title: string
  dueDate: DateTime
  transaction: {
    id: number
    clientName: string
    propertyAddress: string | null
  }
}

interface UserDigest {
  user: User
  overdue: ConditionWithTransaction[]
  upcoming: ConditionWithTransaction[]
}

export class ReminderService {
  /**
   * Process daily digest job - sends summary email to each user
   */
  static async processDailyDigest(_job: Job<DailyDigestPayload>) {
    logger.info('Processing daily digest job')

    // Get all active users (users with at least one active transaction)
    const users = await User.query()

    for (const user of users) {
      try {
        const digest = await this.buildUserDigest(user)

        if (digest.overdue.length === 0 && digest.upcoming.length === 0) {
          logger.debug({ userId: user.id }, 'No conditions to report for user')
          continue
        }

        await this.sendDigestEmail(digest)
        logger.info({ userId: user.id, overdue: digest.overdue.length, upcoming: digest.upcoming.length }, 'Digest sent')
      } catch (err) {
        logger.error({ userId: user.id, err }, 'Failed to send digest to user')
      }
    }
  }

  /**
   * Process deadline warning job - sends 48h warning email
   */
  static async processDeadlineWarning(job: Job<DeadlineWarningPayload>) {
    const { conditionId, transactionId } = job.data

    logger.info({ conditionId, transactionId }, 'Processing deadline warning')

    const condition = await Condition.find(conditionId)

    if (!condition || condition.status !== 'pending') {
      logger.info({ conditionId }, 'Condition no longer pending or not found - skipping warning')
      return
    }

    const transaction = await Transaction.query()
      .where('id', condition.transactionId)
      .preload('client')
      .preload('property')
      .first()

    if (!transaction) {
      logger.warn({ conditionId }, 'Transaction not found for condition')
      return
    }

    const user = await User.find(transaction.ownerUserId)
    if (!user?.email) {
      logger.warn({ transactionId }, 'User not found or no email')
      return
    }

    const client = transaction.client
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'
    const propertyAddress = transaction.property?.address ?? null

    const frontendUrl = process.env.FRONTEND_URL ?? 'https://ofra.pages.dev'

    await mail.send(
      new DeadlineWarningMail({
        to: user.email,
        userName: user.fullName ?? user.email,
        conditionTitle: condition.title,
        clientName,
        propertyAddress,
        dueDate: condition.dueDate?.toFormat('dd MMMM yyyy') ?? 'N/A',
        transactionUrl: `${frontendUrl}/transactions/${transactionId}`,
      })
    )

    logger.info({ conditionId, userId: user.id }, 'Deadline warning email sent')
  }

  /**
   * Build digest data for a specific user
   */
  private static async buildUserDigest(user: User): Promise<UserDigest> {
    const now = DateTime.now()
    const sevenDaysFromNow = now.plus({ days: 7 })

    // Get all transactions for this user that are not completed or canceled
    const transactions = await Transaction.query()
      .where('owner_user_id', user.id)
      .whereNotIn('status', ['completed', 'canceled'])
      .preload('client')
      .preload('property')

    const transactionIds = transactions.map((t) => t.id)

    if (transactionIds.length === 0) {
      return { user, overdue: [], upcoming: [] }
    }

    // Get all pending conditions for these transactions
    const conditions = await Condition.query()
      .whereIn('transaction_id', transactionIds)
      .where('status', 'pending')
      .whereNotNull('due_date')
      .orderBy('due_date', 'asc')

    // Create a map of transactions for quick lookup
    const transactionMap = new Map(transactions.map((t) => [t.id, t]))

    const overdue: ConditionWithTransaction[] = []
    const upcoming: ConditionWithTransaction[] = []

    for (const condition of conditions) {
      if (!condition.dueDate) continue

      const transaction = transactionMap.get(condition.transactionId)
      if (!transaction) continue

      const clientName = transaction.client
        ? `${transaction.client.firstName} ${transaction.client.lastName}`
        : 'Unknown Client'

      const item: ConditionWithTransaction = {
        id: condition.id,
        title: condition.title,
        dueDate: condition.dueDate,
        transaction: {
          id: transaction.id,
          clientName,
          propertyAddress: transaction.property?.address ?? null,
        },
      }

      if (condition.dueDate < now) {
        overdue.push(item)
      } else if (condition.dueDate <= sevenDaysFromNow) {
        upcoming.push(item)
      }
    }

    return { user, overdue, upcoming }
  }

  /**
   * Send digest email to user
   */
  private static async sendDigestEmail(digest: UserDigest) {
    const { user, overdue, upcoming } = digest
    const frontendUrl = process.env.FRONTEND_URL ?? 'https://ofra.pages.dev'

    await mail.send(
      new DailyDigestMail({
        to: user.email,
        userName: user.fullName ?? user.email,
        overdue: overdue.map((c) => ({
          title: c.title,
          clientName: c.transaction.clientName,
          propertyAddress: c.transaction.propertyAddress,
          dueDate: c.dueDate.toFormat('dd MMMM yyyy'),
          daysOverdue: Math.floor(DateTime.now().diff(c.dueDate, 'days').days),
          transactionUrl: `${frontendUrl}/transactions/${c.transaction.id}`,
        })),
        upcoming: upcoming.map((c) => ({
          title: c.title,
          clientName: c.transaction.clientName,
          propertyAddress: c.transaction.propertyAddress,
          dueDate: c.dueDate.toFormat('dd MMMM yyyy'),
          daysUntil: Math.ceil(c.dueDate.diff(DateTime.now(), 'days').days),
          transactionUrl: `${frontendUrl}/transactions/${c.transaction.id}`,
        })),
        dashboardUrl: `${frontendUrl}/dashboard`,
      })
    )
  }

  /**
   * Check conditions and schedule 48h warnings
   * This should be called periodically (e.g., every hour)
   */
  static async scheduleUpcomingWarnings() {
    const { queueService } = await import('#services/queue_service')

    const now = DateTime.now()
    const in48h = now.plus({ hours: 48 })
    const in49h = now.plus({ hours: 49 }) // 1-hour window

    // Get transactions that are not completed or canceled
    const activeTransactionIds = await Transaction.query()
      .whereNotIn('status', ['completed', 'canceled'])
      .select('id')

    const transactionIds = activeTransactionIds.map((t) => t.id)

    if (transactionIds.length === 0) {
      return
    }

    // Find conditions with due date in 48-49 hours
    const conditions = await Condition.query()
      .whereIn('transaction_id', transactionIds)
      .where('status', 'pending')
      .whereNotNull('due_date')
      .where('due_date', '>=', in48h.toSQL()!)
      .where('due_date', '<', in49h.toSQL()!)

    for (const condition of conditions) {
      if (!condition.dueDate) continue

      const delayMs = condition.dueDate.diff(now.plus({ hours: 48 }), 'milliseconds').milliseconds

      try {
        await queueService.scheduleDeadlineWarning(
          {
            conditionId: condition.id,
            transactionId: condition.transactionId,
            dueDate: condition.dueDate.toISO()!,
          },
          Math.max(0, delayMs)
        )
      } catch (err) {
        // Job might already exist (duplicate key), which is fine
        if (!String(err).includes('already exists')) {
          logger.error({ conditionId: condition.id, err }, 'Failed to schedule deadline warning')
        }
      }
    }
  }
}
