import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

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

  constructor(opts: {
    to: string
    userName: string
    overdue: ConditionItem[]
    upcoming: ConditionItem[]
    dashboardUrl: string
  }) {
    super()
    this.message.to(opts.to)
    this.userName = opts.userName
    this.overdue = opts.overdue
    this.upcoming = opts.upcoming
    this.dashboardUrl = opts.dashboardUrl

    const overdueText = opts.overdue.length > 0 ? `${opts.overdue.length} en retard` : ''
    const upcomingText = `${opts.upcoming.length} cette semaine`
    this.subject = `[Ofra] ${overdueText}${overdueText ? ' · ' : ''}${upcomingText}`
  }

  prepare() {
    const fromAddress = env.get('MAIL_FROM_ADDRESS', 'noreply@ofra.app')
    const fromName = env.get('MAIL_FROM_NAME', 'Ofra CRM')

    this.message
      .from(fromAddress, fromName)
      .subject(this.subject)
      .html(this.buildHtml())
  }

  private buildHtml(): string {
    const styles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937; }
        h1 { color: #111827; font-size: 24px; }
        h2 { color: #374151; font-size: 18px; margin-top: 24px; }
        .section { margin: 20px 0; padding: 16px; border-radius: 8px; }
        .overdue { background-color: #fef2f2; border-left: 4px solid #ef4444; }
        .upcoming { background-color: #fefce8; border-left: 4px solid #f59e0b; }
        .condition { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .condition:last-child { border-bottom: none; }
        .condition-title { font-weight: 600; color: #111827; }
        .condition-details { font-size: 14px; color: #6b7280; margin-top: 4px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
        .badge-red { background-color: #fee2e2; color: #dc2626; }
        .badge-orange { background-color: #fef3c7; color: #d97706; }
        .cta { display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
      </style>
    `

    let overdueHtml = ''
    if (this.overdue.length > 0) {
      overdueHtml = `
        <div class="section overdue">
          <h2>En retard (${this.overdue.length})</h2>
          ${this.overdue.map(c => `
            <div class="condition">
              <div class="condition-title">
                ${c.title}
                <span class="badge badge-red">-${c.daysOverdue}j</span>
              </div>
              <div class="condition-details">
                ${c.clientName}${c.propertyAddress ? ` · ${c.propertyAddress}` : ''}<br>
                Échéance: ${c.dueDate} · <a href="${c.transactionUrl}">Voir le dossier</a>
              </div>
            </div>
          `).join('')}
        </div>
      `
    }

    let upcomingHtml = ''
    if (this.upcoming.length > 0) {
      upcomingHtml = `
        <div class="section upcoming">
          <h2>Cette semaine (${this.upcoming.length})</h2>
          ${this.upcoming.map(c => `
            <div class="condition">
              <div class="condition-title">
                ${c.title}
                <span class="badge badge-orange">${c.daysUntil}j</span>
              </div>
              <div class="condition-details">
                ${c.clientName}${c.propertyAddress ? ` · ${c.propertyAddress}` : ''}<br>
                Échéance: ${c.dueDate} · <a href="${c.transactionUrl}">Voir le dossier</a>
              </div>
            </div>
          `).join('')}
        </div>
      `
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>${styles}</head>
      <body>
        <h1>Bonjour ${this.userName},</h1>
        <p>Voici votre résumé quotidien des conditions à suivre.</p>

        ${overdueHtml}
        ${upcomingHtml}

        <a href="${this.dashboardUrl}" class="cta">Voir le tableau de bord</a>

        <div class="footer">
          Cet email a été envoyé automatiquement par Ofra.<br>
          Vous recevez ce message car vous avez des transactions actives.
        </div>
      </body>
      </html>
    `
  }
}
