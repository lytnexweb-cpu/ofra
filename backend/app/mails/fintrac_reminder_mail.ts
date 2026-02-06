import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, getCommonTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class FintracReminderMail extends BaseMail {
  subject: string
  clientName: string
  propertyAddress: string | null
  lang: EmailLanguage

  constructor(opts: {
    to: string
    clientName: string
    propertyAddress?: string | null
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.clientName = opts.clientName
    this.propertyAddress = opts.propertyAddress ?? null

    const t = getTranslation('fintracReminder', this.lang)
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
    const t = getTranslation('fintracReminder', this.lang)
    const common = getCommonTranslation(this.lang)

    const propertyText = this.propertyAddress
      ? ` ${t.forTransaction} <strong>${this.propertyAddress}</strong>`
      : ''

    const body = `
      <h1>${t.title}</h1>
      <p>${common.greeting} ${this.clientName},</p>

      <div class="info-box">
        <p style="margin: 0;">
          <strong>📋 ${t.actionRequired}</strong> ${t.completeDocumentation}${propertyText}.
        </p>
      </div>

      <p>${t.fintracExplanation}</p>

      <h2>${t.requiredDocsTitle}</h2>
      <ul>
        ${t.requiredDocsItems.map((item) => `<li>${item}</li>`).join('')}
      </ul>

      <p>${t.agentHelp}</p>

      <p class="text-small text-muted mt-4">
        ${t.mandatoryNotice}
      </p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
