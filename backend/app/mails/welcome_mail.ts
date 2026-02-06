import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, getCommonTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class WelcomeMail extends BaseMail {
  subject: string
  userName: string
  loginUrl: string
  lang: EmailLanguage

  constructor(opts: {
    to: string
    userName: string
    loginUrl?: string
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.userName = opts.userName
    this.loginUrl = opts.loginUrl ?? env.get('FRONTEND_URL', 'https://ofra.ca')

    const t = getTranslation('welcome', this.lang)
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
    const t = getTranslation('welcome', this.lang)
    const common = getCommonTranslation(this.lang)

    const body = `
      <h1>${t.title}</h1>
      <p>${common.greeting} ${this.userName},</p>
      <p>${t.intro}</p>

      <div class="text-center">
        <a href="${this.loginUrl}" class="cta-button">${t.cta}</a>
      </div>

      <h2>${t.gettingStartedTitle}</h2>
      <ul>
        ${t.gettingStartedItems.map((item) => `<li>${item}</li>`).join('')}
      </ul>

      <p>${t.helpText}</p>
      <p>${t.welcomeClosing}</p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
