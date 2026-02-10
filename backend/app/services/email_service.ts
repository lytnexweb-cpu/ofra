import logger from '@adonisjs/core/services/logger'

/**
 * Email Service — Stub implementation
 *
 * Logs emails instead of sending them.
 * Replace with real SMTP/Resend/SES integration when ready.
 *
 * Covers notification types from maquettes:
 * - Member invitation (maquette 11)
 * - Transaction recap (maquette 10)
 * - Offer submitted (maquette 12)
 * - Transaction cancelled/archived (maquettes 06, 07)
 */

export interface EmailPayload {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

export class EmailService {
  /**
   * Send an email (stub: logs only)
   */
  static async send(payload: EmailPayload): Promise<void> {
    logger.info(
      { to: payload.to, subject: payload.subject, template: payload.template },
      '[EmailService:stub] Email would be sent'
    )
  }

  /**
   * Invite a member to a transaction (maquette 11)
   */
  static async sendMemberInvitation(params: {
    email: string
    inviterName: string
    transactionLabel: string
    role: string
    message?: string
  }): Promise<void> {
    await this.send({
      to: params.email,
      subject: `Invitation à rejoindre une transaction — ${params.transactionLabel}`,
      template: 'member-invitation',
      data: params,
    })
  }

  /**
   * Send transaction recap (maquette 10)
   */
  static async sendTransactionRecap(params: {
    email: string
    transactionLabel: string
    summary: Record<string, any>
  }): Promise<void> {
    await this.send({
      to: params.email,
      subject: `Récapitulatif — ${params.transactionLabel}`,
      template: 'transaction-recap',
      data: params,
    })
  }

  /**
   * Notify about offer submitted (maquette 12)
   */
  static async sendOfferNotification(params: {
    email: string
    transactionLabel: string
    offerAmount: number
    offerStatus: string
  }): Promise<void> {
    await this.send({
      to: params.email,
      subject: `Nouvelle offre — ${params.transactionLabel}`,
      template: 'offer-notification',
      data: params,
    })
  }

  /**
   * Notify about transaction cancellation/archival (maquettes 06, 07)
   */
  static async sendTransactionStatusChange(params: {
    email: string
    transactionLabel: string
    newStatus: string
    reason?: string
  }): Promise<void> {
    await this.send({
      to: params.email,
      subject: `Transaction ${params.newStatus} — ${params.transactionLabel}`,
      template: 'transaction-status-change',
      data: params,
    })
  }
}
