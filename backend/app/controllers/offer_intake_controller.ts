import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import TransactionShareLink from '#models/transaction_share_link'
import TransactionParty from '#models/transaction_party'
import Transaction from '#models/transaction'
import Offer from '#models/offer'
import { OfferService } from '#services/offer_service'
import { ActivityFeedService } from '#services/activity_feed_service'
import { NotificationService } from '#services/notification_service'
import { offerIntakeValidator, offerIntakeRespondValidator } from '#validators/offer_intake_validator'
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

      // 6. Create offer via OfferService (Phase B: enriched fields)
      const offer = await OfferService.createOffer({
        transactionId: transaction.id,
        price: payload.price,
        notes: payload.message,
        deposit: payload.deposit,
        financingAmount: payload.financingAmount,
        depositDeadline: payload.depositDeadline ? DateTime.fromISO(payload.depositDeadline) : undefined,
        closingDate: payload.closingDate ? DateTime.fromISO(payload.closingDate) : undefined,
        inspectionRequired: payload.inspectionRequired,
        inspectionDelay: payload.inspectionDelay,
        inclusions: payload.inclusions,
        message: payload.message,
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

      // 10. Return success with offerId for Phase C negotiation tracking
      return response.created({
        success: true,
        data: { message: 'Offer submitted successfully', offerId: offer.id },
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

  /**
   * Phase C: Get offer status + revision history for negotiation tracking.
   * Public endpoint — token + offerId required.
   *
   * GET /api/offer-intake/:token/status/:offerId
   */
  async status({ params, response }: HttpContext) {
    try {
      const link = await this.resolveLink(params.token, response)
      if (!link) return // response already sent

      const offer = await Offer.query()
        .where('id', params.offerId)
        .where('transaction_id', link.transactionId)
        .preload('revisions', (q) => q.orderBy('revision_number', 'asc').preload('fromParty').preload('toParty'))
        .preload('buyerParty')
        .preload('sellerParty')
        .first()

      if (!offer) {
        return response.notFound({
          success: false,
          error: { message: 'Offer not found', code: 'E_OFFER_NOT_FOUND' },
        })
      }

      // Determine whose turn it is — last revision's direction tells us who made the last move
      const lastRevision = offer.revisions[offer.revisions.length - 1]
      const waitingFor = lastRevision?.direction === 'buyer_to_seller' ? 'seller' : 'buyer'

      return response.ok({
        success: true,
        data: {
          offerId: offer.id,
          status: offer.status,
          waitingFor,
          buyerName: offer.buyerParty?.fullName ?? null,
          sellerName: offer.sellerParty?.fullName ?? null,
          revisions: offer.revisions.map((rev) => ({
            revisionNumber: rev.revisionNumber,
            price: rev.price,
            deposit: rev.deposit,
            financingAmount: rev.financingAmount,
            depositDeadline: rev.depositDeadline,
            closingDate: rev.closingDate,
            inspectionRequired: rev.inspectionRequired,
            inspectionDelay: rev.inspectionDelay,
            inclusions: rev.inclusions,
            message: rev.message ?? rev.notes,
            direction: rev.direction,
            fromName: rev.fromParty?.fullName ?? null,
            toName: rev.toParty?.fullName ?? null,
            createdAt: rev.createdAt.toISO(),
          })),
        },
      })
    } catch (error) {
      logger.error({ error, token: params.token }, 'Offer intake status failed')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to load offer status', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Phase C: Respond to a counter-offer from the public link.
   * Public endpoint — rate limited.
   *
   * POST /api/offer-intake/:token/respond/:offerId
   */
  async respond({ params, request, response }: HttpContext) {
    try {
      const link = await this.resolveLink(params.token, response)
      if (!link) return

      const payload = await request.validateUsing(offerIntakeRespondValidator)

      const offer = await Offer.query()
        .where('id', params.offerId)
        .where('transaction_id', link.transactionId)
        .preload('revisions', (q) => q.orderBy('revision_number', 'desc').limit(1).preload('fromParty').preload('toParty'))
        .first()

      if (!offer) {
        return response.notFound({
          success: false,
          error: { message: 'Offer not found', code: 'E_OFFER_NOT_FOUND' },
        })
      }

      if (!['received', 'countered'].includes(offer.status)) {
        return response.forbidden({
          success: false,
          error: { message: `Cannot respond to offer with status '${offer.status}'`, code: 'E_OFFER_CLOSED' },
        })
      }

      const transaction = await Transaction.findOrFail(link.transactionId)

      // addRevision auto-inverts direction and from/to party IDs
      const revision = await OfferService.addRevision({
        offerId: offer.id,
        price: payload.price,
        deposit: payload.deposit,
        financingAmount: payload.financingAmount,
        notes: payload.message,
        depositDeadline: payload.depositDeadline ? DateTime.fromISO(payload.depositDeadline) : undefined,
        closingDate: payload.closingDate ? DateTime.fromISO(payload.closingDate) : undefined,
        inspectionRequired: payload.inspectionRequired,
        inspectionDelay: payload.inspectionDelay,
        inclusions: payload.inclusions,
        createdByUserId: transaction.ownerUserId,
      })

      // Notify the broker
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
          icon: '🔄',
          severity: 'urgent',
          title: `Contre-offre reçue: ${formattedPrice}`,
          body: `Révision #${revision.revisionNumber}`,
          link: `/transactions/${transaction.id}`,
        })
      } catch (notifError) {
        logger.error({ notifError }, 'Failed to notify broker of intake response — non-blocking')
      }

      return response.created({
        success: true,
        data: { message: 'Response submitted', revisionNumber: revision.revisionNumber },
      })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({
          success: false,
          error: { message: 'Validation failed', code: 'E_VALIDATION_FAILED', details: error.messages },
        })
      }
      logger.error({ error, token: params.token }, 'Offer intake respond failed')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to submit response', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * Shared helper: resolve and validate token → TransactionShareLink
   */
  private async resolveLink(token: string, response: any): Promise<TransactionShareLink | null> {
    const link = await TransactionShareLink.query()
      .where('token', token)
      .where('link_type', 'offer_intake')
      .first()

    if (!link) {
      response.notFound({ success: false, error: { message: 'Link not found', code: 'E_LINK_NOT_FOUND' } })
      return null
    }
    if (!link.isActive) {
      response.forbidden({ success: false, error: { message: 'This link has been disabled', code: 'E_LINK_DISABLED' } })
      return null
    }
    if (link.expiresAt && link.expiresAt < DateTime.now()) {
      response.gone({ success: false, error: { message: 'This link has expired', code: 'E_LINK_EXPIRED' } })
      return null
    }
    return link
  }
}
