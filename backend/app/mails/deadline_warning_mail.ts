import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent, OFRA_COLORS } from './partials/email_layout.js'
import { getTranslation, getCommonTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class DeadlineWarningMail extends BaseMail {
  subject: string
  userName: string
  conditionTitle: string
  clientName: string
  propertyAddress: string | null
  dueDate: string
  transactionUrl: string
  lang: EmailLanguage

  constructor(opts: {
    to: string
    userName: string
    conditionTitle: string
    clientName: string
    propertyAddress: string | null
    dueDate: string
    transactionUrl: string
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.userName = opts.userName
    this.conditionTitle = opts.conditionTitle
    this.clientName = opts.clientName
    this.propertyAddress = opts.propertyAddress
    this.dueDate = opts.dueDate
    this.transactionUrl = opts.transactionUrl

    const t = getTranslation('deadlineWarning', this.lang)
    this.subject = `[Ofra] ${t.subjectPrefix} : ${opts.conditionTitle} - ${opts.clientName}`
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
    const t = getTranslation('deadlineWarning', this.lang)
    const common = getCommonTranslation(this.lang)

    const body = `
      <h1>${common.greeting} ${this.userName},</h1>

      <div class="info-box warning-box">
        <div style="font-size: 32px; margin-bottom: 12px;">⏰</div>
        <h2 style="margin-top: 0; color: ${OFRA_COLORS.warning};">${this.conditionTitle}</h2>
        <p style="margin-bottom: 16px;">${t.warningText} <strong>${t.hours48}</strong>.</p>

        <div style="background: white; border-radius: 6px; padding: 16px;">
          <div style="padding: 8px 0; border-bottom: 1px solid #FDE68A;">
            <span style="font-weight: 500; color: #78350F;">${common.client}:</span>
            <span style="color: ${OFRA_COLORS.text}; margin-left: 8px;">${this.clientName}</span>
          </div>
          ${this.propertyAddress ? `
          <div style="padding: 8px 0; border-bottom: 1px solid #FDE68A;">
            <span style="font-weight: 500; color: #78350F;">${common.property}:</span>
            <span style="color: ${OFRA_COLORS.text}; margin-left: 8px;">${this.propertyAddress}</span>
          </div>
          ` : ''}
          <div style="padding: 8px 0;">
            <span style="font-weight: 500; color: #78350F;">${common.dueDate}:</span>
            <span style="color: ${OFRA_COLORS.text}; margin-left: 8px;">${this.dueDate}</span>
          </div>
        </div>
      </div>

      <p>${t.actionRequired}</p>

      <div class="text-center">
        <a href="${this.transactionUrl}" class="cta-button cta-button-warning">${t.cta}</a>
      </div>

      <p class="text-small text-muted mt-4">
        ${t.autoSentNotice}
      </p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
