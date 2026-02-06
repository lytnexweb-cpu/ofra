import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class CelebrationMail extends BaseMail {
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

    const t = getTranslation('celebration', this.lang)
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
    const t = getTranslation('celebration', this.lang)

    const welcomeText = this.propertyAddress
      ? `${t.welcomeHomeAt} <strong>${this.propertyAddress}</strong>.`
      : `${t.welcomeHome}.`

    const body = `
      <div class="text-center" style="margin-bottom: 24px;">
        <div style="font-size: 64px;">🏠🎊🔑</div>
      </div>

      <h1 style="text-align: center;">${t.title}, ${this.clientName}!</h1>

      <div class="info-box success-box text-center">
        <p style="margin: 0; font-size: 20px;">
          <strong>${t.bigDay}</strong>
        </p>
      </div>

      <p style="text-align: center; font-size: 18px;">
        ${welcomeText}
      </p>

      <p>${t.thankYou}</p>

      <p>${t.moveInHelp}</p>

      <p style="text-align: center; font-size: 24px; margin-top: 32px;">
        🎉 ${t.celebrationClosing} 🎉
      </p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
