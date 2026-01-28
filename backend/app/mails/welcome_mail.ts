import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

export default class WelcomeMail extends BaseMail {
  subject: string
  userName: string
  loginUrl: string

  constructor(opts: { to: string; subject?: string; userName: string; loginUrl?: string }) {
    super()
    this.message.to(opts.to)
    this.subject = opts.subject ?? 'Welcome to Ofra!'
    this.userName = opts.userName
    this.loginUrl = opts.loginUrl ?? env.get('FRONTEND_URL', 'https://ofra.app')
  }

  prepare() {
    const fromAddress = env.get('MAIL_FROM_ADDRESS', 'noreply@ofra.app')
    const fromName = env.get('MAIL_FROM_NAME', 'Ofra CRM')

    this.message
      .from(fromAddress, fromName)
      .subject(this.subject)
      .html(
        `<h1>Welcome to Ofra!</h1>` +
          `<p>Hello ${this.userName},</p>` +
          `<p>Your account has been created successfully. You can now start managing your real estate transactions with Ofra.</p>` +
          `<p style="margin: 24px 0;">` +
          `<a href="${this.loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Go to Ofra</a>` +
          `</p>` +
          `<h2>Getting Started</h2>` +
          `<ul>` +
          `<li>Add your first client</li>` +
          `<li>Create a transaction</li>` +
          `<li>Track conditions and deadlines</li>` +
          `</ul>` +
          `<p>If you have any questions, don't hesitate to reach out.</p>` +
          `<p>Welcome aboard!</p>`
      )
  }
}
