import type Transaction from '#models/transaction'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'

/**
 * TransactionAutomationService
 *
 * Service responsable de l'envoi automatique d'emails aux clients
 * lors des changements de statut de transaction.
 *
 * Mapping des emails:
 * - Type ACHAT (purchase):
 *   - status 'accepted' → Email A1 (Offre acceptée)
 *   - status 'notary' → Email A2 (Deal FIRM)
 *   - status 'completed' → Email A3 (Closing/Remise des clés)
 *
 * - Type VENTE (sale):
 *   - status 'accepted' → Email V1 (Offre acceptée)
 *   - status 'notary' → Email V2 (Deal FIRM)
 *   - status 'completed' → Email V3 (Vente complétée)
 */
export class TransactionAutomationService {
  /**
   * Point d'entrée principal: gère l'envoi automatique d'email
   * en fonction du changement de statut et du type de transaction
   */
  public static async handleStatusChange(
    transaction: Transaction,
    previousStatus: string,
    newStatus: string
  ) {
    // Si le statut n'a pas changé, ne rien faire
    if (previousStatus === newStatus) {
      return
    }

    // Charger le client si pas déjà chargé
    if (!transaction.client) {
      await transaction.load('client')
    }

    const client = transaction.client

    // Si pas de client ou pas d'email, ne pas envoyer
    if (!client || !client.email) {
      console.log('[TransactionAutomation] Client sans email, email non envoyé')
      return
    }

    // Déterminer quel email envoyer en fonction du type et du statut
    const type = transaction.type
    const emailMethod = this.getEmailMethod(type, newStatus)

    if (emailMethod) {
      await emailMethod.call(this, transaction, client)
    }
  }

  /**
   * Retourne la méthode d'envoi d'email appropriée
   * en fonction du type de transaction et du nouveau statut
   */
  private static getEmailMethod(
    type: string,
    newStatus: string
  ): ((transaction: Transaction, client: any) => Promise<void>) | null {
    // Mapping pour les achats (purchase)
    if (type === 'purchase') {
      switch (newStatus) {
        case 'accepted':
          return this.sendBuyerOfferAcceptedEmail
        case 'notary':
          return this.sendBuyerFirmEmail
        case 'completed':
          return this.sendBuyerClosingEmail
      }
    }

    // Mapping pour les ventes (sale)
    if (type === 'sale') {
      switch (newStatus) {
        case 'accepted':
          return this.sendSellerOfferAcceptedEmail
        case 'notary':
          return this.sendSellerFirmEmail
        case 'completed':
          return this.sendSellerClosingEmail
      }
    }

    // Statut non reconnu ou pas d'email associé
    return null
  }

  // ========================================================================
  // EMAILS POUR ACHAT (BUYER)
  // ========================================================================

  /**
   * Email A1 - Acheteur: Offre acceptée
   */
  private static async sendBuyerOfferAcceptedEmail(_transaction: Transaction, client: any) {
    const clientName = `${client.firstName} ${client.lastName}`

    await mail.send((message) => {
      message
        .from(env.get('MAIL_FROM_ADDRESS')!, env.get('MAIL_FROM_NAME') || 'CRM Yanick')
        .to(client.email)
        .subject('🎉 Félicitations ! Votre offre a été acceptée')
        .html(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .section { margin-bottom: 20px; }
              .highlight { background: #EEF2FF; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Félicitations ${clientName} !</h1>
              </div>
              <div class="content">
                <div class="section">
                  <p>C'est avec plaisir que je vous annonce que <strong>votre offre d'achat a été acceptée</strong> par le vendeur.</p>
                  <p>Ceci est une excellente nouvelle et nous passons maintenant à l'étape suivante du processus d'acquisition de votre future propriété.</p>
                </div>

                <div class="highlight">
                  <h3>⚠️ Conditions importantes à respecter</h3>
                  <p>Votre offre comporte certaines conditions qui doivent être remplies dans les délais prévus :</p>
                  <ul>
                    <li><strong>Financement</strong> : Confirmation de votre prêt hypothécaire</li>
                    <li><strong>Inspection</strong> : Inspection de la propriété par un professionnel</li>
                    <li><strong>Autres conditions</strong> : Tel que spécifié dans votre offre</li>
                  </ul>
                </div>

                <div class="section">
                  <h3>📋 Prochaines étapes pour vous :</h3>
                  <ol>
                    <li>Finaliser votre demande de financement auprès de votre institution financière</li>
                    <li>Planifier l'inspection de la propriété dans les délais convenus</li>
                    <li>Me tenir informé de l'avancement de vos démarches</li>
                    <li>Rester disponible pour répondre aux questions ou demandes du vendeur</li>
                  </ol>
                </div>

                <div class="section">
                  <p>Je reste à votre entière disposition pour vous accompagner tout au long de ce processus. N'hésitez pas à me contacter si vous avez des questions ou des préoccupations.</p>
                </div>

                <div class="footer">
                  <p>Cordialement,<br>
                  <strong>Yanick - Agent immobilier</strong></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `)
    })

    console.log(`[TransactionAutomation] Email A1 (Buyer Offer Accepted) envoyé à ${client.email}`)
  }

  /**
   * Email A2 - Acheteur: Deal FIRM
   */
  private static async sendBuyerFirmEmail(_transaction: Transaction, client: any) {
    const clientName = `${client.firstName} ${client.lastName}`

    await mail.send((message) => {
      message
        .from(env.get('MAIL_FROM_ADDRESS')!, env.get('MAIL_FROM_NAME') || 'CRM Yanick')
        .to(client.email)
        .subject('✅ Transaction FERME - Votre achat est maintenant confirmé')
        .html(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .section { margin-bottom: 20px; }
              .highlight { background: #D1FAE5; padding: 15px; border-left: 4px solid #10B981; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Transaction FERME !</h1>
              </div>
              <div class="content">
                <div class="section">
                  <p>Bonjour ${clientName},</p>
                  <p>Excellente nouvelle ! <strong>Votre transaction est maintenant FERME</strong>. Toutes les conditions ont été levées avec succès.</p>
                  <p>Cela signifie que votre achat est maintenant confirmé et que nous nous dirigeons vers la conclusion finale de la transaction.</p>
                </div>

                <div class="highlight">
                  <h3>📅 Prochaine étape : La signature chez le notaire</h3>
                  <p>Nous sommes maintenant en processus de finalisation avec le notaire pour préparer l'acte de vente et la remise des clés.</p>
                </div>

                <div class="section">
                  <h3>📋 Prochaines étapes pour vous :</h3>
                  <ol>
                    <li><strong>Notaire</strong> : Prendre rendez-vous pour la signature de l'acte de vente</li>
                    <li><strong>Assurances</strong> : Finaliser votre assurance habitation</li>
                    <li><strong>Visite finale</strong> : Planifier une visite finale de la propriété avant le closing</li>
                    <li><strong>Préparation</strong> : Organiser votre déménagement et la remise des clés</li>
                  </ol>
                </div>

                <div class="section">
                  <p>Nous approchons de la ligne d'arrivée ! Je vous tiendrai informé des détails concernant la signature finale et la remise des clés.</p>
                  <p>N'hésitez pas à me contacter pour toute question.</p>
                </div>

                <div class="footer">
                  <p>Cordialement,<br>
                  <strong>Yanick - Agent immobilier</strong></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `)
    })

    console.log(`[TransactionAutomation] Email A2 (Buyer FIRM) envoyé à ${client.email}`)
  }

  /**
   * Email A3 - Acheteur: Closing / Remise des clés
   */
  private static async sendBuyerClosingEmail(_transaction: Transaction, client: any) {
    const clientName = `${client.firstName} ${client.lastName}`

    await mail.send((message) => {
      message
        .from(env.get('MAIL_FROM_ADDRESS')!, env.get('MAIL_FROM_NAME') || 'CRM Yanick')
        .to(client.email)
        .subject('🏡 Félicitations pour votre nouvelle propriété !')
        .html(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .section { margin-bottom: 20px; }
              .highlight { background: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Félicitations ${clientName} !</h1>
              </div>
              <div class="content">
                <div class="section">
                  <p>C'est avec une immense joie que je vous félicite pour <strong>l'acquisition de votre nouvelle propriété</strong> !</p>
                  <p>La transaction est maintenant complétée et les clés sont à vous. Bienvenue chez vous !</p>
                </div>

                <div class="section">
                  <p>Ce fut un réel plaisir de vous accompagner tout au long de ce processus important. Votre confiance et votre collaboration ont été essentielles à la réussite de ce projet.</p>
                </div>

                <div class="highlight">
                  <h3>💬 Votre avis compte pour moi</h3>
                  <p>Si vous avez apprécié mes services, j'apprécierais grandement que vous preniez quelques instants pour laisser un avis sur Google. Votre témoignage aide d'autres personnes à choisir le bon agent immobilier.</p>
                  <p>Cela ne prend que 2 minutes et fait une réelle différence pour mon entreprise.</p>
                </div>

                <div class="section">
                  <p>Je reste disponible si vous avez besoin de recommandations (entrepreneurs, services, etc.) ou simplement pour discuter de votre nouvelle propriété.</p>
                  <p>Je vous souhaite beaucoup de bonheur dans votre nouveau chez-vous !</p>
                </div>

                <div class="footer">
                  <p>Cordialement,<br>
                  <strong>Yanick - Agent immobilier</strong></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `)
    })

    console.log(
      `[TransactionAutomation] Email A3 (Buyer Closing/Keys Delivered) envoyé à ${client.email}`
    )
  }

  // ========================================================================
  // EMAILS POUR VENTE (SELLER)
  // ========================================================================

  /**
   * Email V1 - Vendeur: Offre acceptée
   */
  private static async sendSellerOfferAcceptedEmail(_transaction: Transaction, client: any) {
    const clientName = `${client.firstName} ${client.lastName}`

    await mail.send((message) => {
      message
        .from(env.get('MAIL_FROM_ADDRESS')!, env.get('MAIL_FROM_NAME') || 'CRM Yanick')
        .to(client.email)
        .subject('🎉 Bonne nouvelle ! Une offre a été acceptée pour votre propriété')
        .html(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .section { margin-bottom: 20px; }
              .highlight { background: #EEF2FF; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Bonne nouvelle ${clientName} !</h1>
              </div>
              <div class="content">
                <div class="section">
                  <p>Je suis heureux de vous annoncer qu'<strong>une offre d'achat a été acceptée pour votre propriété</strong>.</p>
                  <p>C'est une étape importante dans le processus de vente et nous nous rapprochons de la conclusion de la transaction.</p>
                </div>

                <div class="highlight">
                  <h3>⏳ Période conditionnelle en cours</h3>
                  <p>L'acheteur doit maintenant remplir certaines conditions avant que la transaction ne devienne ferme :</p>
                  <ul>
                    <li><strong>Financement</strong> : L'acheteur doit obtenir son prêt hypothécaire</li>
                    <li><strong>Inspection</strong> : Une inspection de la propriété sera effectuée</li>
                    <li><strong>Autres conditions</strong> : Tel que spécifié dans l'offre d'achat</li>
                  </ul>
                  <p>Durant cette période, il est important de rester flexible et disponible.</p>
                </div>

                <div class="section">
                  <h3>📋 Prochaines étapes pour vous :</h3>
                  <ol>
                    <li><strong>Être disponible</strong> pour l'inspection de la propriété</li>
                    <li><strong>Maintenir la propriété</strong> dans le même état qu'au moment de l'offre</li>
                    <li><strong>Répondre rapidement</strong> aux demandes raisonnables de l'acheteur</li>
                    <li><strong>Me tenir informé</strong> de tout changement ou préoccupation</li>
                  </ol>
                </div>

                <div class="section">
                  <p>Je vous tiendrai informé de l'avancement des démarches de l'acheteur. Si tout se passe bien, la transaction devrait devenir ferme sous peu.</p>
                  <p>N'hésitez pas à me contacter si vous avez des questions.</p>
                </div>

                <div class="footer">
                  <p>Cordialement,<br>
                  <strong>Yanick - Agent immobilier</strong></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `)
    })

    console.log(
      `[TransactionAutomation] Email V1 (Seller Offer Accepted) envoyé à ${client.email}`
    )
  }

  /**
   * Email V2 - Vendeur: Deal FIRM
   */
  private static async sendSellerFirmEmail(_transaction: Transaction, client: any) {
    const clientName = `${client.firstName} ${client.lastName}`

    await mail.send((message) => {
      message
        .from(env.get('MAIL_FROM_ADDRESS')!, env.get('MAIL_FROM_NAME') || 'CRM Yanick')
        .to(client.email)
        .subject('✅ Vente FERME - Votre transaction est maintenant confirmée')
        .html(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .section { margin-bottom: 20px; }
              .highlight { background: #D1FAE5; padding: 15px; border-left: 4px solid #10B981; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Vente FERME !</h1>
              </div>
              <div class="content">
                <div class="section">
                  <p>Bonjour ${clientName},</p>
                  <p>Excellente nouvelle ! <strong>Votre vente est maintenant FERME</strong>. L'acheteur a levé toutes ses conditions avec succès.</p>
                  <p>Cela signifie que la transaction est confirmée et que nous nous dirigeons vers la conclusion finale de la vente.</p>
                </div>

                <div class="highlight">
                  <h3>📅 Prochaine étape : Signature chez le notaire</h3>
                  <p>Nous allons maintenant finaliser les derniers détails avec le notaire pour préparer la vente et la remise des clés.</p>
                </div>

                <div class="section">
                  <h3>📋 Prochaines étapes pour vous :</h3>
                  <ol>
                    <li><strong>Planifier votre déménagement</strong> selon la date de closing convenue</li>
                    <li><strong>Préparer la propriété</strong> pour la remise des clés (nettoyage, réparations convenues)</li>
                    <li><strong>Rassembler tous les documents</strong> relatifs à la propriété (garanties, manuels, clés, etc.)</li>
                    <li><strong>Rendez-vous notaire</strong> : Je vous confirmerai la date et l'heure de signature</li>
                  </ol>
                </div>

                <div class="section">
                  <p>Nous approchons de la conclusion de votre transaction ! Je vous tiendrai informé de tous les détails concernant la signature finale.</p>
                  <p>N'hésitez pas à me contacter pour toute question.</p>
                </div>

                <div class="footer">
                  <p>Cordialement,<br>
                  <strong>Yanick - Agent immobilier</strong></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `)
    })

    console.log(`[TransactionAutomation] Email V2 (Seller FIRM) envoyé à ${client.email}`)
  }

  /**
   * Email V3 - Vendeur: Vente complétée
   */
  private static async sendSellerClosingEmail(_transaction: Transaction, client: any) {
    const clientName = `${client.firstName} ${client.lastName}`

    await mail.send((message) => {
      message
        .from(env.get('MAIL_FROM_ADDRESS')!, env.get('MAIL_FROM_NAME') || 'CRM Yanick')
        .to(client.email)
        .subject('🏆 Félicitations ! Votre vente est complétée')
        .html(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .section { margin-bottom: 20px; }
              .highlight { background: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Félicitations ${clientName} !</h1>
              </div>
              <div class="content">
                <div class="section">
                  <p>C'est avec plaisir que je vous confirme que <strong>la vente de votre propriété est maintenant complétée</strong> !</p>
                  <p>La transaction s'est déroulée avec succès et l'acheteur est maintenant propriétaire de votre ancienne propriété.</p>
                </div>

                <div class="section">
                  <p>Ce fut un honneur de vous accompagner dans cette vente importante. Votre confiance et votre collaboration ont été essentielles à la réussite de ce projet.</p>
                </div>

                <div class="highlight">
                  <h3>💬 Votre avis est précieux</h3>
                  <p>Si vous avez apprécié mes services, j'apprécierais grandement que vous preniez quelques instants pour laisser un avis sur Google.</p>
                  <p>Votre témoignage aide d'autres vendeurs à choisir le bon agent immobilier et fait une réelle différence pour mon entreprise.</p>
                  <p>N'hésitez pas non plus à me recommander à vos proches qui auraient besoin de services immobiliers !</p>
                </div>

                <div class="section">
                  <p>Je reste disponible si vous avez besoin d'assistance pour un futur projet immobilier ou simplement pour des recommandations.</p>
                  <p>Je vous souhaite beaucoup de succès dans vos projets futurs !</p>
                </div>

                <div class="footer">
                  <p>Cordialement,<br>
                  <strong>Yanick - Agent immobilier</strong></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `)
    })

    console.log(
      `[TransactionAutomation] Email V3 (Seller Closing Completed) envoyé à ${client.email}`
    )
  }
}
