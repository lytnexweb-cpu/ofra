import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

export default class DeadlineWarningMail extends BaseMail {
  subject: string
  userName: string
  conditionTitle: string
  clientName: string
  propertyAddress: string | null
  dueDate: string
  transactionUrl: string

  constructor(opts: {
    to: string
    userName: string
    conditionTitle: string
    clientName: string
    propertyAddress: string | null
    dueDate: string
    transactionUrl: string
  }) {
    super()
    this.message.to(opts.to)
    this.userName = opts.userName
    this.conditionTitle = opts.conditionTitle
    this.clientName = opts.clientName
    this.propertyAddress = opts.propertyAddress
    this.dueDate = opts.dueDate
    this.transactionUrl = opts.transactionUrl
    this.subject = `[Ofra] Deadline dans 48h : ${opts.conditionTitle} - ${opts.clientName}`
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
        .warning-box { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .warning-icon { font-size: 32px; margin-bottom: 12px; }
        .condition-title { font-size: 20px; font-weight: 600; color: #92400e; }
        .details { margin-top: 16px; }
        .detail-row { padding: 8px 0; border-bottom: 1px solid #fde68a; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 500; color: #78350f; }
        .detail-value { color: #1f2937; }
        .cta { display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .cta:hover { background-color: #d97706; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
      </style>
    `

    return `
      <!DOCTYPE html>
      <html>
      <head>${styles}</head>
      <body>
        <h1>Bonjour ${this.userName},</h1>

        <div class="warning-box">
          <div class="warning-icon">&#9888;</div>
          <div class="condition-title">${this.conditionTitle}</div>
          <p>Cette condition arrive à échéance dans <strong>48 heures</strong>.</p>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Client:</span>
              <span class="detail-value">${this.clientName}</span>
            </div>
            ${this.propertyAddress ? `
            <div class="detail-row">
              <span class="detail-label">Propriété:</span>
              <span class="detail-value">${this.propertyAddress}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Échéance:</span>
              <span class="detail-value">${this.dueDate}</span>
            </div>
          </div>
        </div>

        <p>Assurez-vous que cette condition soit complétée avant la date limite pour éviter tout blocage.</p>

        <a href="${this.transactionUrl}" class="cta">Voir la transaction</a>

        <div class="footer">
          Cet email a été envoyé automatiquement par Ofra.<br>
          Vous recevez ce message car une condition importante approche de son échéance.
        </div>
      </body>
      </html>
    `
  }
}
