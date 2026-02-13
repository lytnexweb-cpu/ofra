import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class ShareLinkMail extends BaseMail {
  subject: string
  role: string
  hasPassword: boolean
  expiresAt: string | null
  transactionId: number
  lang: EmailLanguage

  constructor(opts: {
    to: string
    role: string
    hasPassword: boolean
    expiresAt?: string | null
    transactionId: number
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.role = opts.role
    this.hasPassword = opts.hasPassword
    this.expiresAt = opts.expiresAt ?? null
    this.transactionId = opts.transactionId

    const t = getTranslation('shareLink', this.lang)
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
    const t = getTranslation('shareLink', this.lang)
    const roleLabel = (t.roles as Record<string, string>)[this.role] ?? this.role
    const appUrl = env.get('APP_URL', 'https://app.ofra.ca')

    const body = `
      <div class="text-center" style="margin-bottom: 24px;">
        <div style="font-size: 48px;">🔗</div>
      </div>

      <h1 style="text-align: center;">${t.title}</h1>

      <div class="info-box">
        <p style="margin: 0;">${t.intro}</p>
      </div>

      <p><strong>${t.accessLevel}:</strong> ${roleLabel}</p>
      <p><strong>${t.passwordProtected}:</strong> ${this.hasPassword ? t.yes : t.no}</p>
      <p><strong>${t.expiresAt}:</strong> ${this.expiresAt ?? t.noExpiry}</p>

      <div class="text-center" style="margin: 32px 0;">
        <a href="${appUrl}/transactions/${this.transactionId}/share" class="btn">${t.cta}</a>
      </div>

      <p class="text-muted">${t.securityNotice}</p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
