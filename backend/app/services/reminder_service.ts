import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import brand from '#config/brand'
import User from '#models/user'
import Transaction from '#models/transaction'
import ReminderLog from '#models/reminder_log'
import type { ReminderType, EntityType } from '#models/reminder_log'

interface ConditionWithRelations {
  id: number
  title: string
  dueDate: DateTime | null
  transaction: {
    id: number
    type: string
    status: string
    client: {
      id: number
      firstName: string
      lastName: string
    }
  }
}

interface DigestData {
  overdueConditions: ConditionWithRelations[]
  dueSoonConditions: ConditionWithRelations[]
}

/**
 * ReminderService
 *
 * Service responsible for sending proactive reminder emails to agents
 * about their pending conditions.
 *
 * Reminder types:
 * - digest: Daily digest at 08:00 with overdue + due < 7 days
 * - due_48h: Individual reminder 48 hours before due date
 * - overdue: Individual daily reminder for overdue conditions
 */
export class ReminderService {
  /**
   * Check if a reminder has already been sent today
   */
  private static async hasReminderBeenSent(
    ownerUserId: number,
    type: ReminderType,
    entityType: EntityType,
    entityId: number | null,
    date: DateTime
  ): Promise<boolean> {
    const existing = await ReminderLog.query()
      .where('owner_user_id', ownerUserId)
      .where('type', type)
      .where('entity_type', entityType)
      .where((query) => {
        if (entityId === null) {
          query.whereNull('entity_id')
        } else {
          query.where('entity_id', entityId)
        }
      })
      .where('sent_on', date.toISODate()!)
      .first()

    return !!existing
  }

  /**
   * Log a reminder as sent
   */
  private static async logReminder(
    ownerUserId: number,
    type: ReminderType,
    entityType: EntityType,
    entityId: number | null,
    date: DateTime
  ): Promise<void> {
    await ReminderLog.create({
      ownerUserId,
      type,
      entityType,
      entityId,
      sentOn: date,
      sentAt: DateTime.now(),
    })
  }

  /**
   * Get all pending conditions for a user that need attention
   * - Overdue: dueDate < today
   * - Due soon: dueDate <= today + 7 days
   */
  private static async getConditionsForUser(userId: number): Promise<DigestData> {
    const today = DateTime.now().startOf('day')
    const sevenDaysFromNow = today.plus({ days: 7 })

    // Get transactions for this user
    const transactions = await Transaction.query()
      .where('owner_user_id', userId)
      .preload('client')
      .preload('conditions', (query) => {
        query.where('status', 'pending').whereNotNull('due_date').orderBy('due_date', 'asc')
      })

    const overdueConditions: ConditionWithRelations[] = []
    const dueSoonConditions: ConditionWithRelations[] = []

    for (const transaction of transactions) {
      for (const condition of transaction.conditions) {
        if (!condition.dueDate) continue

        const dueDate = condition.dueDate.startOf('day')

        const conditionWithRelations: ConditionWithRelations = {
          id: condition.id,
          title: condition.title,
          dueDate: condition.dueDate,
          transaction: {
            id: transaction.id,
            type: transaction.type,
            status: transaction.status,
            client: {
              id: transaction.client.id,
              firstName: transaction.client.firstName,
              lastName: transaction.client.lastName,
            },
          },
        }

        if (dueDate < today) {
          overdueConditions.push(conditionWithRelations)
        } else if (dueDate <= sevenDaysFromNow) {
          dueSoonConditions.push(conditionWithRelations)
        }
      }
    }

    return { overdueConditions, dueSoonConditions }
  }

  /**
   * Get conditions that are due within 48 hours (for individual reminder)
   */
  private static async getConditionsDue48h(userId: number): Promise<ConditionWithRelations[]> {
    const today = DateTime.now().startOf('day')
    const twoDaysFromNow = today.plus({ days: 2 })

    const transactions = await Transaction.query()
      .where('owner_user_id', userId)
      .preload('client')
      .preload('conditions', (query) => {
        query
          .where('status', 'pending')
          .whereNotNull('due_date')
          .whereBetween('due_date', [today.toISODate()!, twoDaysFromNow.toISODate()!])
          .orderBy('due_date', 'asc')
      })

    const result: ConditionWithRelations[] = []

    for (const transaction of transactions) {
      for (const condition of transaction.conditions) {
        result.push({
          id: condition.id,
          title: condition.title,
          dueDate: condition.dueDate,
          transaction: {
            id: transaction.id,
            type: transaction.type,
            status: transaction.status,
            client: {
              id: transaction.client.id,
              firstName: transaction.client.firstName,
              lastName: transaction.client.lastName,
            },
          },
        })
      }
    }

    return result
  }

  /**
   * Get overdue conditions (for individual daily reminder)
   */
  private static async getOverdueConditions(userId: number): Promise<ConditionWithRelations[]> {
    const today = DateTime.now().startOf('day')

    const transactions = await Transaction.query()
      .where('owner_user_id', userId)
      .preload('client')
      .preload('conditions', (query) => {
        query
          .where('status', 'pending')
          .whereNotNull('due_date')
          .where('due_date', '<', today.toISODate()!)
          .orderBy('due_date', 'asc')
      })

    const result: ConditionWithRelations[] = []

    for (const transaction of transactions) {
      for (const condition of transaction.conditions) {
        result.push({
          id: condition.id,
          title: condition.title,
          dueDate: condition.dueDate,
          transaction: {
            id: transaction.id,
            type: transaction.type,
            status: transaction.status,
            client: {
              id: transaction.client.id,
              firstName: transaction.client.firstName,
              lastName: transaction.client.lastName,
            },
          },
        })
      }
    }

    return result
  }

  /**
   * Send daily digest email to a user
   */
  private static async sendDigestEmail(user: User, data: DigestData): Promise<void> {
    const { overdueConditions, dueSoonConditions } = data

    // Don't send if nothing to report
    if (overdueConditions.length === 0 && dueSoonConditions.length === 0) {
      return
    }

    const userName = user.fullName || user.email.split('@')[0]

    const formatConditionRow = (c: ConditionWithRelations) => {
      const clientName = `${c.transaction.client.firstName} ${c.transaction.client.lastName}`
      const dueStr = c.dueDate?.toFormat('MMM d, yyyy') || 'N/A'
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${c.title}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${clientName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${dueStr}</td>
        </tr>
      `
    }

    const overdueSection =
      overdueConditions.length > 0
        ? `
      <div style="margin-bottom: 24px;">
        <h3 style="color: #DC2626; margin-bottom: 12px;">🚨 Overdue (${overdueConditions.length})</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #FEE2E2;">
              <th style="padding: 8px; text-align: left;">Condition</th>
              <th style="padding: 8px; text-align: left;">Client</th>
              <th style="padding: 8px; text-align: left;">Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${overdueConditions.map(formatConditionRow).join('')}
          </tbody>
        </table>
      </div>
    `
        : ''

    const dueSoonSection =
      dueSoonConditions.length > 0
        ? `
      <div style="margin-bottom: 24px;">
        <h3 style="color: #D97706; margin-bottom: 12px;">⏰ Due Soon (${dueSoonConditions.length})</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #FEF3C7;">
              <th style="padding: 8px; text-align: left;">Condition</th>
              <th style="padding: 8px; text-align: left;">Client</th>
              <th style="padding: 8px; text-align: left;">Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${dueSoonConditions.map(formatConditionRow).join('')}
          </tbody>
        </table>
      </div>
    `
        : ''

    await mail.send((message) => {
      message
        .from(env.get('MAIL_FROM_ADDRESS')!, env.get('MAIL_FROM_NAME') || brand.email.fromName)
        .to(user.email)
        .subject(
          `📋 Daily Digest: ${overdueConditions.length} overdue, ${dueSoonConditions.length} due soon`
        )
        .html(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Daily Digest</h1>
                <p style="margin: 0; opacity: 0.9;">${DateTime.now().toFormat('EEEE, MMMM d, yyyy')}</p>
              </div>
              <div class="content">
                <p>Hello ${userName},</p>
                <p>Here's your daily summary of conditions requiring attention:</p>

                ${overdueSection}
                ${dueSoonSection}

                <p style="margin-top: 24px;">
                  <a href="${env.get('FRONTEND_URL', 'https://ofra.pages.dev')}/transactions"
                     style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    View in Ofra
                  </a>
                </p>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />

                <p style="font-size: 12px; color: #6b7280;">
                  Bonjour ${userName},<br>
                  Voici votre résumé quotidien des conditions nécessitant votre attention.
                </p>

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="font-size: 11px; color: #9ca3af; margin: 0;">
                    Developed by <a href="https://www.lytnexweb.ca" style="color: #6b7280; text-decoration: none; font-weight: 600;">LYTNEX WEB</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `)
    })

    console.log(`[ReminderService] Digest email sent to ${user.email}`)
  }

  /**
   * Send individual 48h reminder for a condition
   */
  private static async send48hEmail(
    user: User,
    condition: ConditionWithRelations
  ): Promise<void> {
    const userName = user.fullName || user.email.split('@')[0]
    const clientName = `${condition.transaction.client.firstName} ${condition.transaction.client.lastName}`
    const dueStr = condition.dueDate?.toFormat('EEEE, MMMM d, yyyy') || 'N/A'

    await mail.send((message) => {
      message
        .from(env.get('MAIL_FROM_ADDRESS')!, env.get('MAIL_FROM_NAME') || brand.email.fromName)
        .to(user.email)
        .subject(`⏰ Reminder: "${condition.title}" due in 48h - ${clientName}`)
        .html(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #D97706; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .highlight { background: #FEF3C7; padding: 15px; border-left: 4px solid #D97706; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⏰ 48-Hour Reminder</h1>
              </div>
              <div class="content">
                <p>Hello ${userName},</p>

                <div class="highlight">
                  <p style="margin: 0;"><strong>Condition:</strong> ${condition.title}</p>
                  <p style="margin: 8px 0 0;"><strong>Client:</strong> ${clientName}</p>
                  <p style="margin: 8px 0 0;"><strong>Due:</strong> ${dueStr}</p>
                </div>

                <p>This condition is due within the next 48 hours. Please ensure it's addressed in time.</p>

                <p style="margin-top: 24px;">
                  <a href="${env.get('FRONTEND_URL', 'https://ofra.pages.dev')}/transactions/${condition.transaction.id}"
                     style="display: inline-block; background: #D97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    View Transaction
                  </a>
                </p>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />

                <p style="font-size: 12px; color: #6b7280;">
                  Cette condition est due dans les prochaines 48 heures. Veuillez vous assurer qu'elle est traitée à temps.
                </p>

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="font-size: 11px; color: #9ca3af; margin: 0;">
                    Developed by <a href="https://www.lytnexweb.ca" style="color: #6b7280; text-decoration: none; font-weight: 600;">LYTNEX WEB</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `)
    })

    console.log(
      `[ReminderService] 48h reminder sent to ${user.email} for condition #${condition.id}`
    )
  }

  /**
   * Send individual overdue reminder for a condition
   */
  private static async sendOverdueEmail(
    user: User,
    condition: ConditionWithRelations
  ): Promise<void> {
    const userName = user.fullName || user.email.split('@')[0]
    const clientName = `${condition.transaction.client.firstName} ${condition.transaction.client.lastName}`
    const dueStr = condition.dueDate?.toFormat('EEEE, MMMM d, yyyy') || 'N/A'
    const daysOverdue = condition.dueDate
      ? Math.floor(DateTime.now().diff(condition.dueDate, 'days').days)
      : 0

    await mail.send((message) => {
      message
        .from(env.get('MAIL_FROM_ADDRESS')!, env.get('MAIL_FROM_NAME') || brand.email.fromName)
        .to(user.email)
        .subject(`🚨 OVERDUE: "${condition.title}" - ${clientName} (${daysOverdue} days)`)
        .html(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .highlight { background: #FEE2E2; padding: 15px; border-left: 4px solid #DC2626; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚨 Overdue Condition</h1>
              </div>
              <div class="content">
                <p>Hello ${userName},</p>

                <div class="highlight">
                  <p style="margin: 0;"><strong>Condition:</strong> ${condition.title}</p>
                  <p style="margin: 8px 0 0;"><strong>Client:</strong> ${clientName}</p>
                  <p style="margin: 8px 0 0;"><strong>Was due:</strong> ${dueStr}</p>
                  <p style="margin: 8px 0 0; color: #DC2626;"><strong>Overdue by:</strong> ${daysOverdue} day(s)</p>
                </div>

                <p>This condition is now overdue. Please address it as soon as possible to avoid delays in the transaction.</p>

                <p style="margin-top: 24px;">
                  <a href="${env.get('FRONTEND_URL', 'https://ofra.pages.dev')}/transactions/${condition.transaction.id}"
                     style="display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    View Transaction
                  </a>
                </p>

                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />

                <p style="font-size: 12px; color: #6b7280;">
                  Cette condition est en retard de ${daysOverdue} jour(s). Veuillez la traiter dès que possible.
                </p>

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="font-size: 11px; color: #9ca3af; margin: 0;">
                    Developed by <a href="https://www.lytnexweb.ca" style="color: #6b7280; text-decoration: none; font-weight: 600;">LYTNEX WEB</a>
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `)
    })

    console.log(
      `[ReminderService] Overdue reminder sent to ${user.email} for condition #${condition.id}`
    )
  }

  /**
   * Main entry point: Process all reminders for all users
   */
  public static async processAllReminders(): Promise<{
    digestsSent: number
    due48hSent: number
    overdueSent: number
  }> {
    const today = DateTime.now()
    let digestsSent = 0
    let due48hSent = 0
    let overdueSent = 0

    // Get all users
    const users = await User.all()

    for (const user of users) {
      try {
        // 1. Send digest (once per day per user)
        const digestAlreadySent = await this.hasReminderBeenSent(
          user.id,
          'digest',
          'user',
          user.id,
          today
        )

        if (!digestAlreadySent) {
          const digestData = await this.getConditionsForUser(user.id)
          if (digestData.overdueConditions.length > 0 || digestData.dueSoonConditions.length > 0) {
            await this.sendDigestEmail(user, digestData)
            await this.logReminder(user.id, 'digest', 'user', user.id, today)
            digestsSent++
          }
        }

        // 2. Send individual 48h reminders
        const due48hConditions = await this.getConditionsDue48h(user.id)
        for (const condition of due48hConditions) {
          const alreadySent = await this.hasReminderBeenSent(
            user.id,
            'due_48h',
            'condition',
            condition.id,
            today
          )

          if (!alreadySent) {
            await this.send48hEmail(user, condition)
            await this.logReminder(user.id, 'due_48h', 'condition', condition.id, today)
            due48hSent++
          }
        }

        // 3. Send individual overdue reminders (daily)
        const overdueConditions = await this.getOverdueConditions(user.id)
        for (const condition of overdueConditions) {
          const alreadySent = await this.hasReminderBeenSent(
            user.id,
            'overdue',
            'condition',
            condition.id,
            today
          )

          if (!alreadySent) {
            await this.sendOverdueEmail(user, condition)
            await this.logReminder(user.id, 'overdue', 'condition', condition.id, today)
            overdueSent++
          }
        }
      } catch (error) {
        console.error(`[ReminderService] Error processing reminders for user ${user.id}:`, error)
      }
    }

    return { digestsSent, due48hSent, overdueSent }
  }
}
