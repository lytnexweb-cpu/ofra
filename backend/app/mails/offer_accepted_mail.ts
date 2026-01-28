import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

export default class OfferAcceptedMail extends BaseMail {
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
    this.subject = opts.subject ?? 'Your Offer Has Been Accepted!'
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
          `<p>Great news — your offer${this.propertyAddress ? ` on <strong>${this.propertyAddress}</strong>` : ''} has been accepted.</p>` +
          `<p>Your agent will be in touch with the next steps shortly.</p>`
      )
  }
}
