import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent, OFRA_COLORS } from './partials/email_layout.js'
import { getTranslation, getCommonTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class PasswordResetMail extends BaseMail {
  subject: string
  userName: string
  resetUrl: string
  lang: EmailLanguage

  constructor(opts: {
    to: string
    userName: string
    resetUrl: string
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.userName = opts.userName
    this.resetUrl = opts.resetUrl

    const t = getTranslation('passwordReset', this.lang)
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
    const t = getTranslation('passwordReset', this.lang)
    const common = getCommonTranslation(this.lang)

    const body = `
      <h1>${t.title}</h1>
      <p>${common.greeting} ${this.userName},</p>
      <p>${t.intro}</p>

      <div class="text-center">
        <a href="${this.resetUrl}" class="cta-button">${t.cta}</a>
      </div>

      <div class="info-box warning-box">
        <p style="margin: 0;"><strong>⏱️ ${t.expiryWarning}</strong></p>
      </div>

      <p>${t.ignoreNotice}</p>

      <p class="text-small text-muted mt-4">
        ${t.linkFallback}<br>
        <a href="${this.resetUrl}" style="color: ${OFRA_COLORS.accent}; word-break: break-all;">${this.resetUrl}</a>
      </p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
