import { BaseCommand, args } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import WelcomeMail from '#mails/welcome_mail'
import PasswordResetMail from '#mails/password_reset_mail'
import DailyDigestMail from '#mails/daily_digest_mail'
import DeadlineWarningMail from '#mails/deadline_warning_mail'
import OfferAcceptedMail from '#mails/offer_accepted_mail'
import FirmConfirmedMail from '#mails/firm_confirmed_mail'
import CelebrationMail from '#mails/celebration_mail'
import FintracReminderMail from '#mails/fintrac_reminder_mail'
import GoogleReviewReminderMail from '#mails/google_review_reminder_mail'

export default class TestEmail extends BaseCommand {
  static commandName = 'test:email'
  static description = 'Send test emails to verify templates'

  @args.string({ description: 'Template to test: all, welcome, reset, digest, deadline, offer, firm, celebration, fintrac, review', required: false })
  declare template: string

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const recipient = 'samir.ouridjel@gmail.com'
    const template = this.template || 'all'

    this.logger.info(`Sending test email(s) to ${recipient}...`)

    try {
      if (template === 'all' || template === 'welcome') {
        await this.sendWelcome(recipient, 'fr')
        await this.sendWelcome(recipient, 'en')
      }

      if (template === 'all' || template === 'reset') {
        await this.sendPasswordReset(recipient, 'fr')
      }

      if (template === 'all' || template === 'digest') {
        await this.sendDailyDigest(recipient, 'fr')
      }

      if (template === 'all' || template === 'deadline') {
        await this.sendDeadlineWarning(recipient, 'fr')
      }

      if (template === 'all' || template === 'offer') {
        await this.sendOfferAccepted(recipient, 'fr')
      }

      if (template === 'all' || template === 'firm') {
        await this.sendFirmConfirmed(recipient, 'fr')
      }

      if (template === 'all' || template === 'celebration') {
        await this.sendCelebration(recipient, 'fr')
      }

      if (template === 'all' || template === 'fintrac') {
        await this.sendFintracReminder(recipient, 'fr')
      }

      if (template === 'all' || template === 'review') {
        await this.sendGoogleReview(recipient, 'fr')
      }

      this.logger.success('✅ Tous les emails ont été envoyés!')
    } catch (error) {
      this.logger.error(`❌ Erreur: ${error.message}`)
      console.error(error)
    }
  }

  private async sendWelcome(to: string, lang: 'fr' | 'en') {
    this.logger.info(`  → Welcome (${lang.toUpperCase()})...`)
    await mail.send(new WelcomeMail({
      to,
      userName: 'Sam',
      language: lang,
    }))
  }

  private async sendPasswordReset(to: string, lang: 'fr' | 'en') {
    this.logger.info(`  → Password Reset (${lang.toUpperCase()})...`)
    await mail.send(new PasswordResetMail({
      to,
      userName: 'Sam',
      resetUrl: 'https://ofra.ca/reset-password?token=abc123',
      language: lang,
    }))
  }

  private async sendDailyDigest(to: string, lang: 'fr' | 'en') {
    this.logger.info(`  → Daily Digest (${lang.toUpperCase()})...`)
    await mail.send(new DailyDigestMail({
      to,
      userName: 'Sam',
      overdue: [
        {
          title: 'Inspection pré-achat',
          clientName: 'Marie Dupont',
          propertyAddress: '123 Rue Principale, Moncton',
          dueDate: '2026-02-01',
          daysOverdue: 4,
          transactionUrl: 'https://ofra.ca/transactions/1',
        },
      ],
      upcoming: [
        {
          title: 'Financement confirmé',
          clientName: 'Jean Tremblay',
          propertyAddress: '456 Ave Acadie, Dieppe',
          dueDate: '2026-02-08',
          daysUntil: 3,
          transactionUrl: 'https://ofra.ca/transactions/2',
        },
        {
          title: 'Documents notaire',
          clientName: 'Sophie Martin',
          propertyAddress: null,
          dueDate: '2026-02-10',
          daysUntil: 5,
          transactionUrl: 'https://ofra.ca/transactions/3',
        },
      ],
      dashboardUrl: 'https://ofra.ca/dashboard',
      language: lang,
    }))
  }

  private async sendDeadlineWarning(to: string, lang: 'fr' | 'en') {
    this.logger.info(`  → Deadline Warning (${lang.toUpperCase()})...`)
    await mail.send(new DeadlineWarningMail({
      to,
      userName: 'Sam',
      conditionTitle: 'Confirmation de financement',
      clientName: 'Pierre Leblanc',
      propertyAddress: '789 Boul Champlain, Saint John',
      dueDate: '7 février 2026',
      transactionUrl: 'https://ofra.ca/transactions/4',
      language: lang,
    }))
  }

  private async sendOfferAccepted(to: string, lang: 'fr' | 'en') {
    this.logger.info(`  → Offer Accepted (${lang.toUpperCase()})...`)
    await mail.send(new OfferAcceptedMail({
      to,
      clientName: 'Marie Dupont',
      propertyAddress: '123 Rue Principale, Moncton',
      language: lang,
    }))
  }

  private async sendFirmConfirmed(to: string, lang: 'fr' | 'en') {
    this.logger.info(`  → Firm Confirmed (${lang.toUpperCase()})...`)
    await mail.send(new FirmConfirmedMail({
      to,
      clientName: 'Jean Tremblay',
      propertyAddress: '456 Ave Acadie, Dieppe',
      language: lang,
    }))
  }

  private async sendCelebration(to: string, lang: 'fr' | 'en') {
    this.logger.info(`  → Celebration (${lang.toUpperCase()})...`)
    await mail.send(new CelebrationMail({
      to,
      clientName: 'Sophie Martin',
      propertyAddress: '321 Rue du Parc, Fredericton',
      language: lang,
    }))
  }

  private async sendFintracReminder(to: string, lang: 'fr' | 'en') {
    this.logger.info(`  → FINTRAC Reminder (${lang.toUpperCase()})...`)
    await mail.send(new FintracReminderMail({
      to,
      clientName: 'Pierre Leblanc',
      propertyAddress: '789 Boul Champlain, Saint John',
      language: lang,
    }))
  }

  private async sendGoogleReview(to: string, lang: 'fr' | 'en') {
    this.logger.info(`  → Google Review (${lang.toUpperCase()})...`)
    await mail.send(new GoogleReviewReminderMail({
      to,
      clientName: 'Marie Dupont',
      agentName: 'Sam Ouridjel',
      reviewUrl: 'https://g.page/r/xxx/review',
      language: lang,
    }))
  }
}
