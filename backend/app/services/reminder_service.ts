import { Job } from 'bullmq'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import logger from '@adonisjs/core/services/logger'
import User from '#models/user'
import Condition from '#models/condition'
import Transaction from '#models/transaction'
import DailyDigestMail from '#mails/daily_digest_mail'
import DeadlineWarningMail from '#mails/deadline_warning_mail'
import TrialReminderMail from '#mails/trial_reminder_mail'
import { NotificationService } from '#services/notification_service'
import { DailyDigestPayload, DeadlineWarningPayload, TrialReminderPayload } from '#services/queue_service'

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
   *
   * Note: Each user's digest is built from their own transactions only
   * (filtered by owner_user_id in buildUserDigest). This ensures tenant
   * isolation - users only receive data about their own transactions.
   */
  static async processDailyDigest(_job: Job<DailyDigestPayload>) {
    logger.info('Processing daily digest job')

    // Only get users who have at least one transaction (optimization)
    // This avoids loading users with no data to report
    const usersWithTransactions = await User.query()
      .whereExists((subQuery) => {
        subQuery
          .from('transactions')
          .whereColumn('transactions.owner_user_id', 'users.id')
      })

    logger.info({ userCount: usersWithTransactions.length }, 'Users with transactions to process')

    for (const user of usersWithTransactions) {
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

    try {
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
    } catch (err) {
      logger.warn({ conditionId, userId: user.id, err }, 'Failed to send deadline warning email — SMTP may be unavailable')
    }

    // Notification twin — urgent bell for 48h deadline
    const lang = user.language?.substring(0, 2) || 'fr'
    try {
      await NotificationService.notify({
        userId: user.id,
        transactionId,
        type: 'deadline_warning',
        icon: '⏰',
        severity: 'urgent',
        title: lang === 'fr'
          ? `Deadline dans 48h : ${condition.title}`
          : `48h deadline: ${condition.title}`,
        body: lang === 'fr'
          ? `${clientName} — ${propertyAddress ?? 'N/A'}`
          : `${clientName} — ${propertyAddress ?? 'N/A'}`,
        link: `/transactions/${transactionId}`,
        emailRecipients: [user.email],
      })
    } catch (notifError) {
      logger.error({ notifError }, 'Failed to create deadline warning notification — non-blocking')
    }
  }

  /**
   * Build digest data for a specific user
   */
  private static async buildUserDigest(user: User): Promise<UserDigest> {
    const now = DateTime.now()
    const sevenDaysFromNow = now.plus({ days: 7 })

    // Get all transactions for this user
    // Note: Transactions don't have a status column - they use workflow steps
    const transactions = await Transaction.query()
      .where('owner_user_id', user.id)
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

    try {
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
    } catch (err) {
      logger.warn({ userId: user.id, err }, 'Failed to send daily digest email — SMTP may be unavailable')
    }

    // Notification twin — daily digest summary
    const lang = user.language?.substring(0, 2) || 'fr'
    const severity = overdue.length > 0 ? 'warning' as const : 'info' as const
    try {
      await NotificationService.notify({
        userId: user.id,
        type: 'daily_digest',
        icon: '📊',
        severity,
        title: lang === 'fr'
          ? `Résumé quotidien`
          : `Daily digest`,
        body: lang === 'fr'
          ? `${overdue.length} en retard, ${upcoming.length} à venir`
          : `${overdue.length} overdue, ${upcoming.length} upcoming`,
        link: '/dashboard',
        emailRecipients: [user.email],
      })
    } catch (notifError) {
      logger.error({ notifError }, 'Failed to create daily digest notification — non-blocking')
    }
  }

  /**
   * D53: Schedule trial reminder emails for a newly registered user.
   * Called once at registration. Schedules J7, J21, J27 reminders.
   */
  static async scheduleTrialReminders(user: User) {
    const { queueService } = await import('#services/queue_service')

    const now = DateTime.now()

    // Schedule reminders at J7 (23 days left), J21 (9 days left), J27 (3 days left)
    const reminders = [
      { day: 7, daysRemaining: 23 },
      { day: 21, daysRemaining: 9 },
      { day: 27, daysRemaining: 3 },
    ]

    for (const { day, daysRemaining } of reminders) {
      const sendAt = now.plus({ days: day })
      const delayMs = Math.max(0, sendAt.diff(now, 'milliseconds').milliseconds)

      try {
        await queueService.scheduleTrialReminder(
          { userId: user.id, daysRemaining },
          delayMs
        )
      } catch (err) {
        if (!String(err).includes('already exists')) {
          logger.error({ userId: user.id, day, err }, 'Failed to schedule trial reminder')
        }
      }
    }

    logger.info({ userId: user.id }, 'Trial reminders scheduled (J7, J21, J27)')
  }

  /**
   * D53: Process a trial reminder job — send email if user is still on trial.
   */
  static async processTrialReminder(job: Job<TrialReminderPayload>) {
    const { userId, daysRemaining } = job.data

    const user = await User.find(userId)
    if (!user) {
      logger.warn({ userId }, 'Trial reminder: user not found — skipping')
      return
    }

    // Skip if user already has a plan (converted during trial)
    if (user.planId || user.subscriptionStatus !== 'trial') {
      logger.info({ userId }, 'Trial reminder: user already converted — skipping')
      return
    }

    try {
      await mail.send(
        new TrialReminderMail({
          to: user.email,
          userName: user.fullName ?? user.email,
          daysRemaining,
          language: user.preferredLanguage,
        })
      )
      logger.info({ userId, daysRemaining }, 'Trial reminder email sent')
    } catch (err) {
      logger.error({ userId, daysRemaining, err }, 'Failed to send trial reminder email')
    }
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

    // Get all transactions (they don't have a status column - they use workflow steps)
    const activeTransactionIds = await Transaction.query()
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
