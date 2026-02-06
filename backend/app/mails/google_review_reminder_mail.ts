import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class GoogleReviewReminderMail extends BaseMail {
  subject: string
  clientName: string
  agentName: string
  reviewUrl: string | null
  lang: EmailLanguage

  constructor(opts: {
    to: string
    clientName: string
    agentName?: string
    reviewUrl?: string | null
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.clientName = opts.clientName
    this.agentName = opts.agentName ?? (this.lang === 'fr' ? 'votre courtier' : 'your agent')
    this.reviewUrl = opts.reviewUrl ?? null

    const t = getTranslation('googleReview', this.lang)
    this.subject = t.subject
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
    const t = getTranslation('googleReview', this.lang)

    const reviewButton = this.reviewUrl
      ? `
        <div class="text-center">
          <a href="${this.reviewUrl}" class="cta-button" style="background-color: #4285F4;">
            ⭐ ${t.cta}
          </a>
        </div>
      `
      : ''

    const body = `
      <div class="text-center" style="margin-bottom: 24px;">
        <div style="font-size: 48px;">⭐</div>
      </div>

      <h1 style="text-align: center;">${t.title}, ${this.clientName}!</h1>

      <p>${t.settledIn}</p>

      <div class="info-box">
        <p style="margin: 0;">
          ${t.ifAgent} ${this.agentName} ${t.reviewRequest}
        </p>
      </div>

      ${reviewButton}

      <p class="text-muted mt-4">
        ${t.thankYou}
      </p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
