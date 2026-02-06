import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import { wrapEmailContent } from '#mails/partials/email_layout'

export default class TestEmail extends BaseCommand {
  static commandName = 'test:email'
  static description = 'Send a test email to verify SMTP configuration'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const fromAddress = env.get('MAIL_FROM_ADDRESS', 'noreply@ofra.ca')
    const fromName = env.get('MAIL_FROM_NAME', 'Ofra')
    const testRecipient = 'samir.ouridjel@gmail.com'

    this.logger.info(`Sending test email from ${fromName} <${fromAddress}> to ${testRecipient}...`)

    try {
      const body = `
        <h1>Test de configuration email</h1>
        <p>Bonjour,</p>
        <p>Si vous recevez cet email, la configuration SMTP fonctionne correctement.</p>

        <div class="info-box success-box">
          <p style="margin: 0;"><strong>✅ Configuration validée!</strong></p>
        </div>

        <div class="text-center">
          <a href="https://ofra.ca" class="cta-button">Visiter Ofra</a>
        </div>

        <p class="text-small text-muted mt-4">
          Envoyé depuis: ${fromName} &lt;${fromAddress}&gt;<br>
          Date: ${new Date().toISOString()}
        </p>
      `

      await mail.send((message) => {
        message
          .from(fromAddress, fromName)
          .to(testRecipient)
          .subject('✅ Ofra - Test Email Configuration')
          .html(wrapEmailContent(body))
      })

      this.logger.success('✅ Email envoyé avec succès!')
    } catch (error) {
      this.logger.error(`❌ Erreur: ${error.message}`)
      console.error(error)
    }
  }
}
