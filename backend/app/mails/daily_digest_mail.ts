import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { wrapEmailContent, OFRA_COLORS } from './partials/email_layout.js'
import { getTranslation, getCommonTranslation, normalizeLanguage, type EmailLanguage } from './partials/email_translations.js'

interface ConditionItem {
  title: string
  clientName: string
  propertyAddress: string | null
  dueDate: string
  daysOverdue?: number
  daysUntil?: number
  transactionUrl: string
}

export default class DailyDigestMail extends BaseMail {
  subject: string
  userName: string
  overdue: ConditionItem[]
  upcoming: ConditionItem[]
  dashboardUrl: string
  lang: EmailLanguage

  constructor(opts: {
    to: string
    userName: string
    overdue: ConditionItem[]
    upcoming: ConditionItem[]
    dashboardUrl: string
    language?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.lang = normalizeLanguage(opts.language)
    this.userName = opts.userName
    this.overdue = opts.overdue
    this.upcoming = opts.upcoming
    this.dashboardUrl = opts.dashboardUrl

    const t = getTranslation('dailyDigest', this.lang)
    const overdueText = opts.overdue.length > 0 ? `${opts.overdue.length} ${t.subjectOverdue}` : ''
    const upcomingText = `${opts.upcoming.length} ${t.subjectThisWeek}`
    this.subject = `[Ofra] ${overdueText}${overdueText ? ' · ' : ''}${upcomingText}`
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
    const t = getTranslation('dailyDigest', this.lang)
    const common = getCommonTranslation(this.lang)

    let overdueHtml = ''
    if (this.overdue.length > 0) {
      overdueHtml = `
        <div class="info-box error-box">
          <h2 style="margin-top: 0; color: ${OFRA_COLORS.error};">
            ⚠️ ${t.overdueTitle} (${this.overdue.length})
          </h2>
          ${this.overdue.map(c => `
            <div style="padding: 12px 0; border-bottom: 1px solid #FECACA;">
              <div style="font-weight: 600; color: ${OFRA_COLORS.primary};">
                ${c.title}
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background-color: #FEE2E2; color: ${OFRA_COLORS.error}; margin-left: 8px;">
                  -${c.daysOverdue}${this.lang === 'fr' ? 'j' : 'd'}
                </span>
              </div>
              <div style="font-size: 14px; color: ${OFRA_COLORS.textMuted}; margin-top: 4px;">
                ${c.clientName}${c.propertyAddress ? ` · ${c.propertyAddress}` : ''}<br>
                ${common.dueDate}: ${c.dueDate} · <a href="${c.transactionUrl}" style="color: ${OFRA_COLORS.accent};">${common.viewTransaction}</a>
              </div>
            </div>
          `).join('')}
        </div>
      `
    }

    let upcomingHtml = ''
    if (this.upcoming.length > 0) {
      upcomingHtml = `
        <div class="info-box warning-box">
          <h2 style="margin-top: 0; color: ${OFRA_COLORS.warning};">
            📅 ${t.upcomingTitle} (${this.upcoming.length})
          </h2>
          ${this.upcoming.map(c => `
            <div style="padding: 12px 0; border-bottom: 1px solid #FDE68A;">
              <div style="font-weight: 600; color: ${OFRA_COLORS.primary};">
                ${c.title}
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background-color: #FEF3C7; color: #D97706; margin-left: 8px;">
                  ${c.daysUntil}${this.lang === 'fr' ? 'j' : 'd'}
                </span>
              </div>
              <div style="font-size: 14px; color: ${OFRA_COLORS.textMuted}; margin-top: 4px;">
                ${c.clientName}${c.propertyAddress ? ` · ${c.propertyAddress}` : ''}<br>
                ${common.dueDate}: ${c.dueDate} · <a href="${c.transactionUrl}" style="color: ${OFRA_COLORS.accent};">${common.viewTransaction}</a>
              </div>
            </div>
          `).join('')}
        </div>
      `
    }

    const body = `
      <h1>${common.greeting} ${this.userName},</h1>
      <p>${t.title}</p>

      ${overdueHtml}
      ${upcomingHtml}

      <div class="text-center">
        <a href="${this.dashboardUrl}" class="cta-button">${t.cta}</a>
      </div>

      <p class="text-small text-muted mt-4">
        ${t.autoSentNotice}
      </p>
    `

    return wrapEmailContent(body, this.lang, {
      includeUnsubscribe: true,
      unsubscribeUrl: `${this.dashboardUrl}/settings/notifications`
    })
  }
}
