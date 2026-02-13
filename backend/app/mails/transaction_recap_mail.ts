import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class TransactionRecapMail extends BaseMail {
  subject: string
  clientName: string | null
  propertyAddress: string | null
  status: string
  closingDate: string | null
  salePrice: number | null
  customSubject: string | null
  customMessage: string | null
  transactionId: number
  lang: EmailLanguage

  constructor(opts: {
    to: string
    clientName?: string | null
    propertyAddress?: string | null
    status: string
    closingDate?: string | null
    salePrice?: number | null
    customSubject?: string | null
    customMessage?: string | null
    transactionId: number
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.clientName = opts.clientName ?? null
    this.propertyAddress = opts.propertyAddress ?? null
    this.status = opts.status
    this.closingDate = opts.closingDate ?? null
    this.salePrice = opts.salePrice ?? null
    this.customSubject = opts.customSubject ?? null
    this.customMessage = opts.customMessage ?? null
    this.transactionId = opts.transactionId

    const t = getTranslation('transactionRecap', this.lang)
    this.subject = this.customSubject || t.subject
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
    const t = getTranslation('transactionRecap', this.lang)
    const noData = t.noData
    const statusLabel = (t.statuses as Record<string, string>)[this.status] ?? this.status

    const formattedPrice = this.salePrice
      ? new Intl.NumberFormat(this.lang === 'fr' ? 'fr-CA' : 'en-CA', {
          style: 'currency',
          currency: 'CAD',
          maximumFractionDigits: 0,
        }).format(this.salePrice)
      : noData

    const customMessageHtml = this.customMessage
      ? `
      <div class="info-box" style="margin-top: 24px;">
        <p style="margin: 0;"><strong>${t.customMessageLabel}:</strong></p>
        <p style="margin: 8px 0 0;">${this.customMessage}</p>
      </div>`
      : ''

    const body = `
      <div class="text-center" style="margin-bottom: 24px;">
        <div style="font-size: 48px;">📄</div>
      </div>

      <h1 style="text-align: center;">${t.title}</h1>

      <div class="info-box">
        <p style="margin: 0;">${t.intro}</p>
      </div>

      <p><strong>${t.clientLabel}:</strong> ${this.clientName ?? noData}</p>
      <p><strong>${t.propertyLabel}:</strong> ${this.propertyAddress ?? noData}</p>
      <p><strong>${t.statusLabel}:</strong> ${statusLabel}</p>
      <p><strong>${t.closingDateLabel}:</strong> ${this.closingDate ?? noData}</p>
      <p><strong>${t.salePriceLabel}:</strong> ${formattedPrice}</p>

      ${customMessageHtml}

      <p class="text-muted" style="margin-top: 32px;">${t.sentByBroker}</p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
