import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class PartyAddedMail extends BaseMail {
  subject: string
  partyName: string
  partyRole: string
  brokerName: string
  propertyAddress: string | null
  lang: EmailLanguage

  constructor(opts: {
    to: string
    partyName: string
    partyRole: string
    brokerName: string
    propertyAddress?: string | null
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.partyName = opts.partyName
    this.partyRole = opts.partyRole
    this.brokerName = opts.brokerName
    this.propertyAddress = opts.propertyAddress ?? null

    const t = getTranslation('partyAdded', this.lang)
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
    const t = getTranslation('partyAdded', this.lang)
    const roleLabel = (t.roles as Record<string, string>)[this.partyRole] ?? this.partyRole

    const propertyInfo = this.propertyAddress
      ? `<p><strong>${t.transactionDetails}:</strong> ${this.propertyAddress}</p>`
      : ''

    const body = `
      <div class="text-center" style="margin-bottom: 24px;">
        <div style="font-size: 48px;">📋</div>
      </div>

      <h1 style="text-align: center;">${t.title}, ${this.partyName}!</h1>

      <div class="info-box">
        <p style="margin: 0;">
          ${t.intro} <strong>${this.brokerName}</strong>.
        </p>
      </div>

      <p><strong>${t.roleLabel}:</strong> ${roleLabel}</p>
      ${propertyInfo}

      <p class="text-muted">${t.stayInformed}</p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
