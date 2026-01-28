import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'

export default class PasswordResetMail extends BaseMail {
  subject: string
  userName: string
  resetUrl: string

  constructor(opts: { to: string; subject?: string; userName: string; resetUrl: string }) {
    super()
    this.message.to(opts.to)
    this.subject = opts.subject ?? 'Reset Your Password'
    this.userName = opts.userName
    this.resetUrl = opts.resetUrl
  }

  prepare() {
    const fromAddress = env.get('MAIL_FROM_ADDRESS', 'noreply@ofra.app')
    const fromName = env.get('MAIL_FROM_NAME', 'Ofra CRM')

    this.message
      .from(fromAddress, fromName)
      .subject(this.subject)
      .html(
        `<h1>Password Reset Request</h1>` +
          `<p>Hello ${this.userName},</p>` +
          `<p>We received a request to reset your password. Click the button below to create a new password:</p>` +
          `<p style="margin: 24px 0;">` +
          `<a href="${this.resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>` +
          `</p>` +
          `<p>This link will expire in 1 hour.</p>` +
          `<p>If you didn't request this, you can safely ignore this email. Your password won't be changed.</p>` +
          `<p style="color: #6b7280; font-size: 12px; margin-top: 32px;">` +
          `If the button doesn't work, copy and paste this link into your browser:<br/>` +
          `<a href="${this.resetUrl}">${this.resetUrl}</a>` +
          `</p>`
      )
  }
}
