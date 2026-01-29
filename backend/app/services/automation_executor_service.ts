import mail from '@adonisjs/mail/services/main'
import Transaction from '#models/transaction'
import WorkflowStepAutomation from '#models/workflow_step_automation'
import OfferAcceptedMail from '#mails/offer_accepted_mail'
import FirmConfirmedMail from '#mails/firm_confirmed_mail'
import FintracReminderMail from '#mails/fintrac_reminder_mail'
import CelebrationMail from '#mails/celebration_mail'
import GoogleReviewReminderMail from '#mails/google_review_reminder_mail'
import { ActivityFeedService } from '#services/activity_feed_service'
import logger from '@adonisjs/core/services/logger'

interface AutomationContext {
  stepName: string
  trigger: string
}

interface ExecuteResult {
  sent: boolean
  skipped: boolean
  scheduled?: boolean
  error?: string
}

export class AutomationExecutorService {
  /**
   * Schedule or execute an automation based on delayDays.
   * If delayDays > 0, schedules via BullMQ queue.
   * Otherwise, executes immediately.
   */
  static async scheduleOrExecute(
    automation: WorkflowStepAutomation,
    transactionId: number,
    context: AutomationContext
  ): Promise<ExecuteResult> {
    // If there's a delay, schedule it via the queue
    if (automation.delayDays > 0) {
      try {
        const { queueService } = await import('#services/queue_service')
        const delayMs = automation.delayDays * 24 * 60 * 60 * 1000

        await queueService.scheduleDelayedAutomation(
          {
            automationId: automation.id,
            transactionId,
            stepName: context.stepName,
            trigger: context.trigger,
          },
          delayMs
        )

        await ActivityFeedService.log({
          transactionId,
          activityType: 'automation_scheduled',
          metadata: {
            automationId: automation.id,
            templateRef: automation.templateRef,
            actionType: automation.actionType,
            delayDays: automation.delayDays,
            scheduledFor: new Date(Date.now() + delayMs).toISOString(),
          },
        })

        logger.info(
          { automationId: automation.id, delayDays: automation.delayDays },
          'Automation scheduled for delayed execution'
        )

        return { sent: false, skipped: false, scheduled: true }
      } catch (err) {
        logger.error({ err, automationId: automation.id }, 'Failed to schedule automation')
        // Fall through to execute immediately as fallback
      }
    }

    // Execute immediately
    return this.execute(automation, transactionId, context)
  }

  /**
   * Dispatch a single automation immediately.
   * Returns a result object — never throws.
   */
  static async execute(
    automation: WorkflowStepAutomation,
    transactionId: number,
    context: AutomationContext
  ): Promise<ExecuteResult> {
    try {
      if (automation.actionType === 'send_email') {
        return await this.handleSendEmail(automation, transactionId, context)
      }

      if (automation.actionType === 'create_task') {
        return await this.handleCreateTask(automation, transactionId, context)
      }

      logger.warn(
        { actionType: automation.actionType, automationId: automation.id },
        'Unknown automation actionType — skipped'
      )
      return { sent: false, skipped: true, error: `Unknown actionType: ${automation.actionType}` }
    } catch (err) {
      logger.error({ err, automationId: automation.id }, 'Automation execution failed')
      return { sent: false, skipped: true, error: String(err) }
    }
  }

  /**
   * Handle send_email automations.
   */
  private static async handleSendEmail(
    automation: WorkflowStepAutomation,
    transactionId: number,
    context: AutomationContext
  ): Promise<ExecuteResult> {
    const automationTrigger = {
      automationId: automation.id,
      stepName: context.stepName,
      triggerType: context.trigger,
    }

    const transaction = await Transaction.query()
      .where('id', transactionId)
      .preload('client')
      .preload('property')
      .firstOrFail()

    const client = transaction.client
    if (!client?.email) {
      await ActivityFeedService.log({
        transactionId,
        activityType: 'email_sent',
        metadata: {
          templateRef: automation.templateRef,
          skipped: true,
          reason: 'Client has no email address',
          automationTrigger,
        },
      })
      return { sent: false, skipped: true }
    }

    const mailInstance = this.buildMail(automation, {
      to: client.email,
      clientName: `${client.firstName} ${client.lastName}`,
      propertyAddress: transaction.property?.address ?? null,
      subject: automation.config?.subject ?? undefined,
    })

    if (!mailInstance) {
      await ActivityFeedService.log({
        transactionId,
        activityType: 'email_sent',
        metadata: {
          templateRef: automation.templateRef,
          skipped: true,
          reason: `Unknown templateRef: ${automation.templateRef}`,
          automationTrigger,
        },
      })
      return { sent: false, skipped: true }
    }

    await mail.send(mailInstance)

    const metadata: Record<string, any> = {
      templateRef: automation.templateRef,
      to: client.email,
      skipped: false,
      automationTrigger,
    }
    if (automation.delayDays > 0) {
      metadata.delayNote = `Would normally be delayed ${automation.delayDays} day(s) — executed immediately (sync mode)`
    }

    await ActivityFeedService.log({
      transactionId,
      activityType: 'email_sent',
      metadata,
    })

    return { sent: true, skipped: false }
  }

  /**
   * Handle create_task automations.
   * For now, logs a task_created activity (no tasks table yet).
   */
  private static async handleCreateTask(
    automation: WorkflowStepAutomation,
    transactionId: number,
    context: AutomationContext
  ): Promise<ExecuteResult> {
    const metadata: Record<string, any> = {
      templateRef: automation.templateRef,
      title: automation.config?.title ?? automation.templateRef ?? 'Untitled task',
      skipped: false,
      automationTrigger: {
        automationId: automation.id,
        stepName: context.stepName,
        triggerType: context.trigger,
      },
    }
    if (automation.delayDays > 0) {
      metadata.delayNote = `Would normally be delayed ${automation.delayDays} day(s) — executed immediately (sync mode)`
    }

    await ActivityFeedService.log({
      transactionId,
      activityType: 'task_created',
      metadata,
    })

    return { sent: true, skipped: false }
  }

  /**
   * Map templateRef to a concrete BaseMail class instance.
   */
  private static buildMail(
    automation: WorkflowStepAutomation,
    opts: {
      to: string
      clientName: string
      propertyAddress: string | null
      subject?: string
    }
  ) {
    switch (automation.templateRef) {
      case 'offer_accepted':
        return new OfferAcceptedMail(opts)
      case 'firm_confirmed':
        return new FirmConfirmedMail(opts)
      case 'fintrac_reminder':
        return new FintracReminderMail(opts)
      case 'celebration':
        return new CelebrationMail(opts)
      case 'google_review_reminder':
        return new GoogleReviewReminderMail({
          ...opts,
          agentName: undefined, // Will use default "your agent"
          reviewUrl: null, // Agent can configure this later
        })
      default:
        return null
    }
  }
}
