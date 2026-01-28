import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

export default class GoogleReviewReminderMail extends BaseMail {
  subject: string
  clientName: string
  agentName: string
  reviewUrl: string | null

  constructor(opts: {
    to: string
    subject?: string
    clientName: string
    agentName?: string
    reviewUrl?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.subject = opts.subject ?? 'How was your experience?'
    this.clientName = opts.clientName
    this.agentName = opts.agentName ?? 'your agent'
    this.reviewUrl = opts.reviewUrl ?? null
  }

  prepare() {
    const fromAddress = env.get('MAIL_FROM_ADDRESS', 'noreply@ofra.app')
    const fromName = env.get('MAIL_FROM_NAME', 'Ofra CRM')

    const reviewLink = this.reviewUrl
      ? `<p><a href="${this.reviewUrl}" style="background-color: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Leave a Google Review</a></p>`
      : ''

    this.message
      .from(fromAddress, fromName)
      .subject(this.subject)
      .html(
        `<h1>Thank you, ${this.clientName}!</h1>` +
          `<p>We hope you're settling in well! Now that your transaction is complete, we'd love to hear about your experience.</p>` +
          `<p>If ${this.agentName} provided you with excellent service, a Google review would mean the world to us. It helps other buyers and sellers find trusted professionals.</p>` +
          reviewLink +
          `<p>Thank you for your time and your trust!</p>`
      )
  }
}
