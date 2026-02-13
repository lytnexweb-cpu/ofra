import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class OfferSubmittedMail extends BaseMail {
  subject: string
  price: number
  direction: string
  transactionId: number
  lang: EmailLanguage

  constructor(opts: {
    to: string
    price: number
    direction: string
    transactionId: number
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.price = opts.price
    this.direction = opts.direction
    this.transactionId = opts.transactionId

    const t = getTranslation('offerSubmitted', this.lang)
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
    const t = getTranslation('offerSubmitted', this.lang)
    const directionLabel = (t.directions as Record<string, string>)[this.direction] ?? this.direction
    const appUrl = env.get('APP_URL', 'https://app.ofra.ca')
    const formattedPrice = new Intl.NumberFormat(this.lang === 'fr' ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(this.price)

    const body = `
      <div class="text-center" style="margin-bottom: 24px;">
        <div style="font-size: 48px;">📨</div>
      </div>

      <h1 style="text-align: center;">${t.title}</h1>

      <div class="info-box">
        <p style="margin: 0;">${t.intro}</p>
      </div>

      <p><strong>${t.priceLabel}:</strong> ${formattedPrice}</p>
      <p><strong>${t.directionLabel}:</strong> ${directionLabel}</p>

      <div class="text-center" style="margin: 32px 0;">
        <a href="${appUrl}/transactions/${this.transactionId}" class="btn">${t.cta}</a>
      </div>

      <p class="text-muted">${t.trackNotice}</p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
