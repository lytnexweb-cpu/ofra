import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, getCommonTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

/**
 * D53: Trial reminder email — parametric template for J7, J21, J27.
 * Uses "urgent" style when daysRemaining <= 7.
 */
export default class TrialReminderMail extends BaseMail {
  subject: string
  userName: string
  daysRemaining: number
  pricingUrl: string
  dashboardUrl: string
  lang: EmailLanguage

  constructor(opts: {
    to: string
    userName: string
    daysRemaining: number
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.userName = opts.userName
    this.daysRemaining = opts.daysRemaining

    const frontendUrl = env.get('FRONTEND_URL', 'https://ofra.ca')
    this.pricingUrl = `${frontendUrl}/pricing`
    this.dashboardUrl = frontendUrl

    const t = getTranslation('trialReminder', this.lang)
    const isUrgent = opts.daysRemaining <= 7
    const subjectTemplate = isUrgent ? t.subjectUrgent : t.subjectActive
    this.subject = subjectTemplate.replace('{{days}}', String(opts.daysRemaining))
  }

  prepare() {
    const fromAddress = env.get('MAIL_FROM_ADDRESS', 'noreply@ofra.ca')
    const fromName = env.get('MAIL_FROM_NAME', 'Ofra')

    this.message
      .from(fromAddress, fromName)
      .subject(this.subject)
      .html(this.buildHtml())
  }

  private buildHtml(): string {
    const t = getTranslation('trialReminder', this.lang)
    const common = getCommonTranslation(this.lang)
    const isUrgent = this.daysRemaining <= 7
    const days = String(this.daysRemaining)

    const title = isUrgent ? t.titleUrgent : t.titleActive
    const bodyText = (isUrgent ? t.bodyUrgent : t.bodyActive).replace('{{days}}', days)

    const body = `
      <h1>${title}</h1>
      <p>${common.greeting} ${this.userName},</p>
      <p>${bodyText}</p>

      ${!isUrgent ? `<p>${t.reminderTip}</p>` : ''}

      <div class="text-center">
        <a href="${this.pricingUrl}" class="cta-button">${t.ctaPricing}</a>
      </div>

      ${isUrgent ? `<p style="color: #6b7280; font-size: 14px;">${t.noLoss}</p>` : ''}

      <p>
        <a href="${this.dashboardUrl}" style="color: #6b7280; font-size: 14px;">${t.ctaDashboard}</a>
      </p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
