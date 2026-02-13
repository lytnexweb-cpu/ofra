import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class MemberInvitationMail extends BaseMail {
  subject: string
  inviterName: string
  memberEmail: string
  role: string
  transactionId: number
  lang: EmailLanguage

  constructor(opts: {
    to: string
    inviterName: string
    role: string
    transactionId: number
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.inviterName = opts.inviterName
    this.memberEmail = opts.to
    this.role = opts.role
    this.transactionId = opts.transactionId

    const t = getTranslation('memberInvitation', this.lang)
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
    const t = getTranslation('memberInvitation', this.lang)
    const roleLabel = (t.roles as Record<string, string>)[this.role] ?? this.role
    const appUrl = env.get('APP_URL', 'https://app.ofra.ca')

    const body = `
      <div class="text-center" style="margin-bottom: 24px;">
        <div style="font-size: 48px;">🤝</div>
      </div>

      <h1 style="text-align: center;">${t.title}</h1>

      <div class="info-box">
        <p style="margin: 0;">
          <strong>${this.inviterName}</strong> ${t.intro}
        </p>
      </div>

      <p><strong>${t.roleLabel}:</strong> ${roleLabel}</p>

      <div class="text-center" style="margin: 32px 0;">
        <a href="${appUrl}/transactions/${this.transactionId}" class="btn">${t.cta}</a>
      </div>

      <p class="text-muted">${t.noAccountNotice}</p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
