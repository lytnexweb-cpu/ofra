import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, getCommonTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class SubscriptionConfirmationMail extends BaseMail {
  subject: string
  lang: EmailLanguage

  constructor(
    private opts: {
      to: string
      userName: string
      planName: string
      price: number
      billingCycle: 'monthly' | 'annual'
      isFounder: boolean
      language?: string | null
    }
  ) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    const t = getTranslation('subscriptionConfirmation', this.lang)
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
    const t = getTranslation('subscriptionConfirmation', this.lang)
    const common = getCommonTranslation(this.lang)
    const frontendUrl = env.get('FRONTEND_URL', 'https://ofra.ca')
    const cycleLabel = this.opts.billingCycle === 'monthly' ? t.cycleMonthly : t.cycleAnnual
    const interval = this.opts.billingCycle === 'monthly' ? '/mo' : '/yr'

    const body = `
      <h1>${t.title}</h1>
      <p>${common.greeting} ${this.opts.userName},</p>
      <p>${t.intro}</p>

      <div class="info-box success-box">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; width: 40%;">${t.planLabel}</td>
            <td style="padding: 6px 0;">${this.opts.planName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">${t.priceLabel}</td>
            <td style="padding: 6px 0;">${this.opts.price}$ ${interval}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">${t.cycleLabel}</td>
            <td style="padding: 6px 0;">${cycleLabel}</td>
          </tr>
        </table>
      </div>

      ${this.opts.isFounder ? `<p style="color: #D97706; font-weight: 600;">⭐ ${t.founderNote}</p>` : ''}

      <h2>${t.whatNext}</h2>
      <ul>
        ${t.whatNextItems.map((item) => `<li>${item}</li>`).join('')}
      </ul>

      <div class="text-center">
        <a href="${frontendUrl}" class="cta-button">${t.cta}</a>
      </div>

      <p class="text-small text-muted">${t.supportNote}</p>
      <p>${t.closing}</p>
      <p>${common.regards},<br>${common.teamSignature}</p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
