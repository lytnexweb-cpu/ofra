import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import TransactionShareLink from '#models/transaction_share_link'
import TransactionParty from '#models/transaction_party'
import Transaction from '#models/transaction'
import { OfferService } from '#services/offer_service'
import { ActivityFeedService } from '#services/activity_feed_service'
import { NotificationService } from '#services/notification_service'
import { offerIntakeValidator } from '#validators/offer_intake_validator'
import logger from '@adonisjs/core/services/logger'

export default class OfferIntakeController {
  /**
   * Public endpoint: submit an offer via a shared intake link.
   * No authentication required — rate limited.
   *
   * POST /api/offer-intake/:token
   */
  async submit({ params, request, response }: HttpContext) {
    try {
      // 1. Resolve token
      const link = await TransactionShareLink.query()
        .where('token', params.token)
        .where('link_type', 'offer_intake')
        .first()

      if (!link) {
        return response.notFound({
          success: false,
          error: { message: 'Link not found or invalid', code: 'E_LINK_NOT_FOUND' },
        })
      }

      if (!link.isActive) {
        return response.forbidden({
          success: false,
          error: { message: 'This link has been disabled', code: 'E_LINK_DISABLED' },
        })
      }

      if (link.expiresAt && link.expiresAt < DateTime.now()) {
        return response.gone({
          success: false,
          error: { message: 'This link has expired', code: 'E_LINK_EXPIRED' },
        })
      }

      // 2. Validate payload
      const payload = await request.validateUsing(offerIntakeValidator)

      // 3. Load transaction to get owner info
      const transaction = await Transaction.query()
        .where('id', link.transactionId)
        .preload('parties')
        .firstOrFail()

      // 4. Create TransactionParty (buyer role)
      const party = await TransactionParty.create({
        transactionId: transaction.id,
        role: 'buyer',
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone ?? null,
        isPrimary: false,
      })

      // 5. Auto-fill seller (primary seller if exists)
      const primarySeller = transaction.parties.find(
        (p) => p.role === 'seller' && p.isPrimary
      )
      const anySeller = primarySeller ?? transaction.parties.find((p) => p.role === 'seller')

      // 6. Create offer via OfferService
      await OfferService.createOffer({
        transactionId: transaction.id,
        price: payload.price,
        notes: payload.message,
        direction: 'buyer_to_seller',
        createdByUserId: transaction.ownerUserId,
        fromPartyId: party.id,
        toPartyId: anySeller?.id,
      })

      // 7. Update link access stats
      link.accessCount += 1
      link.lastAccessedAt = DateTime.now()
      await link.save()

      // 8. Log activity
      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: transaction.ownerUserId,
        activityType: 'offer_intake_received',
        metadata: {
          partyName: payload.fullName,
          partyEmail: payload.email,
          price: payload.price,
        },
      })

      // 9. Notify the broker
      try {
        const formattedPrice = new Intl.NumberFormat('fr-CA', {
          style: 'currency',
          currency: 'CAD',
          maximumFractionDigits: 0,
        }).format(payload.price)

        await NotificationService.notify({
          userId: transaction.ownerUserId,
          transactionId: transaction.id,
          type: 'offer_update',
          icon: '📩',
          severity: 'urgent',
          title: `Nouvelle offre reçue: ${formattedPrice}`,
          body: `De ${payload.fullName} (${payload.email})`,
          link: `/transactions/${transaction.id}`,
        })
      } catch (notifError) {
        logger.error({ notifError }, 'Failed to notify broker of intake offer — non-blocking')
      }

      // 10. Return minimal success (no internal IDs exposed)
      return response.created({
        success: true,
        data: { message: 'Offer submitted successfully' },
      })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'E_VALIDATION_FAILED',
            details: error.messages,
          },
        })
      }
      logger.error({ error, token: params.token }, 'Offer intake submission failed')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to submit offer', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Public endpoint: get transaction summary for the intake form.
   * No authentication required.
   *
   * GET /api/offer-intake/:token
   */
  async info({ params, response }: HttpContext) {
    try {
      const link = await TransactionShareLink.query()
        .where('token', params.token)
        .where('link_type', 'offer_intake')
        .first()

      if (!link) {
        return response.notFound({
          success: false,
          error: { message: 'Link not found', code: 'E_LINK_NOT_FOUND' },
        })
      }

      if (!link.isActive) {
        return response.forbidden({
          success: false,
          error: { message: 'This link has been disabled', code: 'E_LINK_DISABLED' },
        })
      }

      if (link.expiresAt && link.expiresAt < DateTime.now()) {
        return response.gone({
          success: false,
          error: { message: 'This link has expired', code: 'E_LINK_EXPIRED' },
        })
      }

      const transaction = await Transaction.query()
        .where('id', link.transactionId)
        .preload('property')
        .preload('owner', (q) => q.select('id', 'fullName'))
        .firstOrFail()

      return response.ok({
        success: true,
        data: {
          property: transaction.property
            ? {
                address: transaction.property.address,
                city: transaction.property.city,
                postalCode: transaction.property.postalCode,
              }
            : null,
          listPrice: transaction.listPrice,
          type: transaction.type,
          brokerName: transaction.owner?.fullName ?? null,
        },
      })
    } catch (error) {
      logger.error({ error, token: params.token }, 'Offer intake info failed')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to load offer form', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
