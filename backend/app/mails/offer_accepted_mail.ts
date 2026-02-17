import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class OfferAcceptedMail extends BaseMail {
  subject: string
  clientName: string
  propertyAddress: string | null
  lang: EmailLanguage

  constructor(opts: {
    to: string
    clientName: string
    propertyAddress?: string | null
    language?: string | null
    subject?: string
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.clientName = opts.clientName
    this.propertyAddress = opts.propertyAddress ?? null

    const t = getTranslation('offerAccepted', this.lang)
    this.subject = opts.subject ?? t.subject
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
    const t = getTranslation('offerAccepted', this.lang)

    const propertyText = this.propertyAddress
      ? ` ${t.forProperty} <strong>${this.propertyAddress}</strong>`
      : ''

    const body = `
      <div class="text-center" style="margin-bottom: 24px;">
        <div style="font-size: 48px;">🎉</div>
      </div>

      <h1 style="text-align: center;">${t.title}, ${this.clientName}!</h1>

      <div class="info-box success-box">
        <p style="margin: 0; font-size: 18px;">
          <strong>${t.excellentNews}</strong> — ${t.offerAcceptedText}${propertyText}.
        </p>
      </div>

      <p>${t.nextSteps}</p>

      <p class="text-muted">
        ${t.closingText}
      </p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
