import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import mail from '@adonisjs/mail/services/main'
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

  @args.string({ description: 'Email address to send to', required: true })
  declare email: string

  @flags.string({ alias: 'l', description: 'Language: fr or en (default: fr)' })
  declare lang: string

  @flags.string({ alias: 't', description: 'Template: all, welcome, reset, digest, deadline, offer, firm, celebration, fintrac, review' })
  declare template: string

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const recipient = this.email
    const lang = (this.lang === 'en' ? 'en' : 'fr') as 'fr' | 'en'
    const template = this.template || 'all'

    this.logger.info(`📬 Envoi des emails de test à ${recipient} (${lang.toUpperCase()})...`)

    try {
      if (template === 'all' || template === 'welcome') {
        await this.sendWelcome(recipient, lang)
      }

      if (template === 'all' || template === 'reset') {
        await this.sendPasswordReset(recipient, lang)
      }

      if (template === 'all' || template === 'digest') {
        await this.sendDailyDigest(recipient, lang)
      }

      if (template === 'all' || template === 'deadline') {
        await this.sendDeadlineWarning(recipient, lang)
      }

      if (template === 'all' || template === 'offer') {
        await this.sendOfferAccepted(recipient, lang)
      }

      if (template === 'all' || template === 'firm') {
        await this.sendFirmConfirmed(recipient, lang)
      }

      if (template === 'all' || template === 'celebration') {
        await this.sendCelebration(recipient, lang)
      }

      if (template === 'all' || template === 'fintrac') {
        await this.sendFintracReminder(recipient, lang)
      }

      if (template === 'all' || template === 'review') {
        await this.sendGoogleReview(recipient, lang)
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
          title: lang === 'fr' ? 'Inspection pré-achat' : 'Pre-purchase inspection',
          clientName: 'Marie Dupont',
          propertyAddress: '123 Rue Principale, Moncton',
          dueDate: '2026-02-01',
          daysOverdue: 4,
          transactionUrl: 'https://ofra.ca/transactions/1',
        },
      ],
      upcoming: [
        {
          title: lang === 'fr' ? 'Financement confirmé' : 'Financing confirmed',
          clientName: 'Jean Tremblay',
          propertyAddress: '456 Ave Acadie, Dieppe',
          dueDate: '2026-02-08',
          daysUntil: 3,
          transactionUrl: 'https://ofra.ca/transactions/2',
        },
        {
          title: lang === 'fr' ? 'Documents notaire' : 'Notary documents',
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
      conditionTitle: lang === 'fr' ? 'Confirmation de financement' : 'Financing confirmation',
      clientName: 'Pierre Leblanc',
      propertyAddress: '789 Boul Champlain, Saint John',
      dueDate: lang === 'fr' ? '7 février 2026' : 'February 7, 2026',
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
