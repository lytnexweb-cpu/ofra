import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

export default class FintracReminderMail extends BaseMail {
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
    this.subject = opts.subject ?? 'FINTRAC Compliance Reminder'
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
        `<h1>FINTRAC Compliance Reminder</h1>` +
          `<p>Hello ${this.clientName},</p>` +
          `<p>This is a reminder to complete the FINTRAC compliance documentation${this.propertyAddress ? ` for your transaction at <strong>${this.propertyAddress}</strong>` : ''}.</p>` +
          `<p>FINTRAC (Financial Transactions and Reports Analysis Centre of Canada) compliance is mandatory for all real estate transactions in Canada.</p>` +
          `<p>Your agent will guide you through the required documentation.</p>`
      )
  }
}
