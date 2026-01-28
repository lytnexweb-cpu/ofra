import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

export default class CelebrationMail extends BaseMail {
  subject: string
  clientName: string
  propertyAddress: string | null

  constructor(opts: {
    to: string
    subject?: string
    clientName: string
    propertyAddress?: string | null
  }) {
    super()
    this.message.to(opts.to)
    this.subject = opts.subject ?? 'Congratulations on Your New Home!'
    this.clientName = opts.clientName
    this.propertyAddress = opts.propertyAddress ?? null
  }

  prepare() {
    const fromAddress = env.get('MAIL_FROM_ADDRESS', 'noreply@ofra.app')
    const fromName = env.get('MAIL_FROM_NAME', 'Ofra CRM')

    this.message
      .from(fromAddress, fromName)
      .subject(this.subject)
      .html(
        `<h1>Congratulations, ${this.clientName}!</h1>` +
          `<p>Today is the big day — the keys are yours!</p>` +
          `<p>${this.propertyAddress ? `Welcome to your new home at <strong>${this.propertyAddress}</strong>.` : 'Welcome to your new home.'}</p>` +
          `<p>Thank you for trusting us with this important milestone. We wish you many happy years in your new space!</p>` +
          `<p>If you have any questions during your move-in, don't hesitate to reach out.</p>`
      )
  }
}
