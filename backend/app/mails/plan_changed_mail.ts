import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent } from './partials/email_layout.js'
import { getTranslation, getCommonTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

export default class PlanChangedMail extends BaseMail {
  subject: string
  lang: EmailLanguage

  constructor(
    private opts: {
      to: string
      userName: string
      previousPlanName: string
      newPlanName: string
      newPrice: number
      billingCycle: 'monthly' | 'annual'
      isUpgrade: boolean
      language?: string | null
    }
  ) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    const t = getTranslation('planChanged', this.lang)
    this.subject = opts.isUpgrade ? t.subjectUpgrade : t.subjectDowngrade
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
    const t = getTranslation('planChanged', this.lang)
    const common = getCommonTranslation(this.lang)
    const frontendUrl = env.get('FRONTEND_URL', 'https://ofra.ca')
    const interval = this.opts.billingCycle === 'monthly' ? '/mo' : '/yr'

    const title = this.opts.isUpgrade ? t.titleUpgrade : t.titleDowngrade
    const intro = this.opts.isUpgrade ? t.introUpgrade : t.introDowngrade
    const boxClass = this.opts.isUpgrade ? 'success-box' : 'info-box'

    const body = `
      <h1>${title}</h1>
      <p>${common.greeting} ${this.opts.userName},</p>
      <p>${intro}</p>

      <div class="info-box ${boxClass}">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; width: 40%;">${t.previousPlan}</td>
            <td style="padding: 6px 0;">${this.opts.previousPlanName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">${t.newPlan}</td>
            <td style="padding: 6px 0; font-weight: 700;">${this.opts.newPlanName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">${t.newPrice}</td>
            <td style="padding: 6px 0;">${this.opts.newPrice}$ ${interval}</td>
          </tr>
        </table>
      </div>

      <p class="text-small text-muted">${t.prorateNote}</p>

      <div class="text-center">
        <a href="${frontendUrl}/account" class="cta-button">${t.cta}</a>
      </div>

      <p class="text-small text-muted">${t.supportNote}</p>
      <p>${common.regards},<br>${common.teamSignature}</p>
    `

    return wrapEmailContent(body, this.lang)
  }
}
