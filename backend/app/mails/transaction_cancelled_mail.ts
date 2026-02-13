import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class TransactionCancelledMail extends BaseMail {
  subject: string
  reason: string | null
  transactionId: number
  lang: EmailLanguage

  constructor(opts: {
    to: string
    reason?: string | null
    transactionId: number
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.reason = opts.reason ?? null
    this.transactionId = opts.transactionId

    const t = getTranslation('transactionCancelled', this.lang)
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
    const t = getTranslation('transactionCancelled', this.lang)
    const appUrl = env.get('APP_URL', 'https://app.ofra.ca')

    const body = `
      <div class="text-center" style="margin-bottom: 24px;">
        <div style="font-size: 48px;">🚫</div>
      </div>

      <h1 style="text-align: center;">${t.title}</h1>

      <div class="info-box" style="border-left: 4px solid #dc2626;">
        <p style="margin: 0;">${t.intro}</p>
      </div>

      <p><strong>${t.reasonLabel}:</strong> ${this.reason ?? t.noReason}</p>

      <div class="text-center" style="margin: 32px 0;">
        <a href="${appUrl}/transactions" class="btn">${t.cta}</a>
      </div>

      <p class="text-muted">${t.archiveNotice}</p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
