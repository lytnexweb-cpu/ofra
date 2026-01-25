import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { ReminderService } from '#services/reminder_service'
import { DateTime } from 'luxon'

export default class SendReminders extends BaseCommand {
  static commandName = 'ofra:reminders:send'
  static description = 'Send proactive reminder emails for pending conditions (digest, 48h, overdue)'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ description: 'Run in dry-run mode (check what would be sent)' })
  declare dryRun: boolean

  async run() {
    const startTime = DateTime.now()
    this.logger.info('='.repeat(60))
    this.logger.info(`📧 Ofra Reminder Service - ${startTime.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ')}`)
    this.logger.info('='.repeat(60))

    if (this.dryRun) {
      this.logger.warning('🔍 DRY RUN MODE - Emails will not be sent')
    }

    try {
      const results = await ReminderService.processAllReminders()

      const duration = DateTime.now().diff(startTime).as('seconds')

      this.logger.info('')
      this.logger.info('✅ Reminder Processing Complete')
      this.logger.info(`   Duration: ${duration.toFixed(1)}s`)
      this.logger.info(`   Digests sent: ${results.digestsSent}`)
      this.logger.info(`   48h reminders sent: ${results.due48hSent}`)
      this.logger.info(`   Overdue reminders sent: ${results.overdueSent}`)
      this.logger.info(`   Total emails: ${results.digestsSent + results.due48hSent + results.overdueSent}`)
      this.logger.info('='.repeat(60))
    } catch (error) {
      this.logger.error('💥 Fatal error during reminder processing:')
      this.logger.error(error instanceof Error ? error.message : 'Unknown error')
      if (error instanceof Error && error.stack) {
        this.logger.error(error.stack)
      }
      this.exitCode = 1
    }
  }
}
