import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const isDev = env.get('NODE_ENV') === 'development'
const hasSmtpCredentials = env.get('SMTP_USERNAME', '') !== '' && env.get('SMTP_PASSWORD', '') !== ''

const mailConfig = defineConfig({
  // Use stub in dev (logs to console) unless SMTP credentials are configured
  default: isDev && !hasSmtpCredentials ? 'stub' : 'smtp',

  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST', 'smtp-relay.brevo.com'),
      port: Number(env.get('SMTP_PORT', '587')),
      auth: {
        type: 'login',
        user: env.get('SMTP_USERNAME', ''),
        pass: env.get('SMTP_PASSWORD', ''),
      },
      tls: {
        rejectUnauthorized: false,
      },
    }),

    // Stub mailer for development - logs emails to console instead of sending
    stub: transports.stub(),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}