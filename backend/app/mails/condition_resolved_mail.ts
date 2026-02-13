import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class ConditionResolvedMail extends BaseMail {
  subject: string
  conditionTitle: string
  resolutionType: string
  transactionId: number
  lang: EmailLanguage

  constructor(opts: {
    to: string
    conditionTitle: string
    resolutionType: string
    transactionId: number
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.conditionTitle = opts.conditionTitle
    this.resolutionType = opts.resolutionType
    this.transactionId = opts.transactionId

    const t = getTranslation('conditionResolved', this.lang)
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
    const t = getTranslation('conditionResolved', this.lang)
    const appUrl = env.get('APP_URL', 'https://app.ofra.ca')
    const resolutionLabel = (t.resolutionTypes as Record<string, string>)[this.resolutionType] ?? this.resolutionType

    const body = `
      <div class="text-center" style="margin-bottom: 24px;">
        <div style="font-size: 48px;">✅</div>
      </div>

      <h1 style="text-align: center;">${t.title}</h1>

      <div class="info-box success-box">
        <p style="margin: 0;">${t.intro}</p>
      </div>

      <p><strong>${t.conditionLabel}:</strong> ${this.conditionTitle}</p>
      <p><strong>${t.resolutionLabel}:</strong> ${resolutionLabel}</p>

      <div class="text-center" style="margin: 32px 0;">
        <a href="${appUrl}/transactions/${this.transactionId}" class="btn">${t.cta}</a>
      </div>

      <p class="text-muted">${t.progressNotice}</p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
