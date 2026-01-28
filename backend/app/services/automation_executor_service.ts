import mail from '@adonisjs/mail/services/main'
import Transaction from '#models/transaction'
import WorkflowStepAutomation from '#models/workflow_step_automation'
import OfferAcceptedMail from '#mails/offer_accepted_mail'
import FirmConfirmedMail from '#mails/firm_confirmed_mail'
import { ActivityFeedService } from '#services/activity_feed_service'
import logger from '@adonisjs/core/services/logger'

interface AutomationContext {
  stepName: string
  trigger: string
}

interface ExecuteResult {
  sent: boolean
  skipped: boolean
  error?: string
}

export class AutomationExecutorService {
  /**
   * Dispatch a single automation.
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
      default:
        return null
    }
  }
}
