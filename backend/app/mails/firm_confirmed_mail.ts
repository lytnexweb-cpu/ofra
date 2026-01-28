import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

export default class FirmConfirmedMail extends BaseMail {
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
    this.subject = opts.subject ?? 'Your Transaction is Now Firm!'
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
        `<h1>Great News, ${this.clientName}!</h1>` +
          `<p>Your transaction${this.propertyAddress ? ` for <strong>${this.propertyAddress}</strong>` : ''} is now firm.</p>` +
          `<p>All conditions have been met. Your agent will guide you through the final steps to closing.</p>`
      )
  }
}
