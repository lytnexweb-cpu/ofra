import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import Transaction from '#models/transaction'
import Offer from '#models/offer'
import { OfferService } from '#services/offer_service'
import { ActivityFeedService } from '#services/activity_feed_service'
import { NotificationService } from '#services/notification_service'
import { TenantScopeService } from '#services/tenant_scope_service'
import {
  createOfferValidator,
  addRevisionValidator,
} from '#validators/offer_validator'
import OfferSubmittedMail from '#mails/offer_submitted_mail'
import OfferCounteredMail from '#mails/offer_countered_mail'
import OfferCounterBuyerMail from '#mails/offer_counter_buyer_mail'
import OfferAcceptedMail from '#mails/offer_accepted_mail'
import OfferRejectedMail from '#mails/offer_rejected_mail'
import OfferWithdrawnMail from '#mails/offer_withdrawn_mail'
import TransactionShareLink from '#models/transaction_share_link'
import TransactionParty from '#models/transaction_party'
import logger from '@adonisjs/core/services/logger'

export default class OffersController {
  async index({ params, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      const transaction = await TenantScopeService.apply(query, auth.user!).firstOrFail()

      const offers = await OfferService.getOffers(transaction.id)

      return response.ok({
        success: true,
        data: { offers },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to retrieve offers', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async store({ params, request, response, auth }: HttpContext) {
    try {
      const query = Transaction.query().where('id', params.id)
      const transaction = await TenantScopeService.apply(query, auth.user!).firstOrFail()

      const payload = await request.validateUsing(createOfferValidator)

      const offer = await OfferService.createOffer({
        transactionId: transaction.id,
        price: payload.price,
        deposit: payload.deposit,
        financingAmount: payload.financingAmount,
        expiryAt: payload.expiryAt ? DateTime.fromISO(payload.expiryAt) : undefined,
        notes: payload.notes,
        direction: payload.direction,
        createdByUserId: auth.user!.id,
        conditionIds: payload.conditionIds,
        fromPartyId: payload.fromPartyId,
        toPartyId: payload.toPartyId,
        buyerPartyId: payload.buyerPartyId,
        sellerPartyId: payload.sellerPartyId,
      })

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'offer_created',
        metadata: { offerId: offer.id, price: payload.price },
      })

      // Email confirmation to broker
      try {
        await mail.send(new OfferSubmittedMail({
          to: auth.user!.email,
          price: payload.price,
          direction: offer.initialDirection,
          transactionId: transaction.id,
          language: auth.user!.language,
        }))
      } catch (mailError) {
        logger.error({ mailError, offerId: offer.id }, 'Failed to send offer submitted email — non-blocking')
      }

      // Notification twin for the broker
      const lang = auth.user!.language?.substring(0, 2) || 'fr'
      const formattedPrice = new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency', currency: 'CAD', maximumFractionDigits: 0,
      }).format(payload.price)
      try {
        await NotificationService.notify({
          userId: auth.user!.id,
          transactionId: transaction.id,
          type: 'offer_created',
          icon: '📨',
          severity: 'info',
          title: lang === 'fr'
            ? `Offre soumise: ${formattedPrice}`
            : `Offer submitted: ${formattedPrice}`,
          body: undefined,
          link: `/transactions/${transaction.id}`,
        })
      } catch (notifError) {
        logger.error({ notifError }, 'Failed to create offer submitted notification — non-blocking')
      }

      return response.created({
        success: true,
        data: { offer },
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
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Transaction not found', code: 'E_NOT_FOUND' },
        })
      }
      if (error.message?.includes('Party') || error.message?.includes('party') || error.message?.includes('Direction')) {
        return response.badRequest({
          success: false,
          error: { message: error.message, code: 'E_PARTY_COHERENCE' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to create offer', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  private async loadOfferWithOwnershipCheck(offerId: number, user: { id: number; organizationId: number | null }) {
    const offer = await Offer.query()
      .where('id', offerId)
      .preload('revisions', (query) => {
        query
          .preload('createdBy')
          .preload('conditions')
          .preload('fromParty')
          .preload('toParty')
          .orderBy('revision_number', 'asc')
      })
      .firstOrFail()

    const query = Transaction.query().where('id', offer.transactionId)
    const transaction = await TenantScopeService.apply(query, user as any).firstOrFail()

    return { offer, transaction }
  }

  private async loadOfferBasicWithOwnershipCheck(offerId: number, user: { id: number; organizationId: number | null }) {
    const offer = await Offer.findOrFail(offerId)

    const query = Transaction.query().where('id', offer.transactionId)
    const transaction = await TenantScopeService.apply(query, user as any).firstOrFail()

    return { offer, transaction }
  }

  async show({ params, response, auth }: HttpContext) {
    try {
      const { offer } = await this.loadOfferWithOwnershipCheck(params.offerId, auth.user!)

      return response.ok({
        success: true,
        data: { offer },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Offer not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to retrieve offer', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async addRevision({ params, request, response, auth }: HttpContext) {
    try {
      const { offer } = await this.loadOfferBasicWithOwnershipCheck(params.offerId, auth.user!)

      const payload = await request.validateUsing(addRevisionValidator)

      const revision = await OfferService.addRevision({
        offerId: offer.id,
        price: payload.price,
        deposit: payload.deposit,
        financingAmount: payload.financingAmount,
        expiryAt: payload.expiryAt ? DateTime.fromISO(payload.expiryAt) : undefined,
        notes: payload.notes,
        direction: payload.direction,
        createdByUserId: auth.user!.id,
        conditionIds: payload.conditionIds,
        fromPartyId: payload.fromPartyId,
        toPartyId: payload.toPartyId,
      })

      // Refresh offer to get updated status
      await offer.refresh()
      await offer.load('revisions', (query) =>
        query.preload('conditions').preload('fromParty').preload('toParty').orderBy('revision_number', 'asc')
      )

      // Email confirmation to broker
      try {
        await mail.send(new OfferCounteredMail({
          to: auth.user!.email,
          price: payload.price,
          revisionNumber: revision.revisionNumber,
          direction: revision.direction,
          transactionId: offer.transactionId,
          language: auth.user!.language,
        }))
      } catch (mailError) {
        logger.error({ mailError, offerId: offer.id }, 'Failed to send offer countered email — non-blocking')
      }

      // N1: Email the buyer party via intake link
      try {
        const buyerParty = offer.buyerPartyId
          ? await TransactionParty.find(offer.buyerPartyId)
          : null
        if (buyerParty?.email) {
          const intakeLink = await TransactionShareLink.query()
            .where('transaction_id', offer.transactionId)
            .where('link_type', 'offer_intake')
            .where('is_active', true)
            .first()
          const appUrl = process.env.APP_URL || 'https://app.ofra.ca'
          const intakeUrl = intakeLink
            ? `${appUrl}/offer/${intakeLink.token}?offerId=${offer.id}`
            : `${appUrl}/offer`
          await mail.send(new OfferCounterBuyerMail({
            to: buyerParty.email,
            price: payload.price,
            revisionNumber: revision.revisionNumber,
            intakeUrl,
          }))
        }
      } catch (buyerMailError) {
        logger.error({ buyerMailError, offerId: offer.id }, 'Failed to send counter-offer email to buyer — non-blocking')
      }

      // Notification twin for the broker
      const lang = auth.user!.language?.substring(0, 2) || 'fr'
      const formattedPrice = new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', {
        style: 'currency', currency: 'CAD', maximumFractionDigits: 0,
      }).format(payload.price)
      try {
        await NotificationService.notify({
          userId: auth.user!.id,
          transactionId: offer.transactionId,
          type: 'offer_countered',
          icon: '🔄',
          severity: 'info',
          title: lang === 'fr'
            ? `Contre-offre #${revision.revisionNumber}: ${formattedPrice}`
            : `Counter-offer #${revision.revisionNumber}: ${formattedPrice}`,
          body: undefined,
          link: `/transactions/${offer.transactionId}`,
        })
      } catch (notifError) {
        logger.error({ notifError }, 'Failed to create offer countered notification — non-blocking')
      }

      return response.created({
        success: true,
        data: { offer, revision },
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
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Offer not found', code: 'E_NOT_FOUND' },
        })
      }
      if (error.message?.includes('Cannot add revision')) {
        return response.badRequest({
          success: false,
          error: { message: error.message, code: 'E_INVALID_OFFER_STATUS' },
        })
      }
      if (error.message?.includes('Party') || error.message?.includes('party') || error.message?.includes('Direction')) {
        return response.badRequest({
          success: false,
          error: { message: error.message, code: 'E_PARTY_COHERENCE' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to add revision', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async accept({ params, response, auth }: HttpContext) {
    try {
      const { transaction } = await this.loadOfferBasicWithOwnershipCheck(
        params.offerId,
        auth.user!
      )

      const { offer: acceptedOffer, advanceResult } = await OfferService.acceptOffer(
        params.offerId,
        auth.user!.id
      )

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'offer_accepted',
        metadata: { offerId: acceptedOffer.id },
      })

      // N2: Email buyer + seller parties about acceptance
      try {
        await transaction.load('property')
        const propertyAddress = transaction.property?.address ?? null
        const partyIds = [acceptedOffer.buyerPartyId, acceptedOffer.sellerPartyId].filter(Boolean)
        if (partyIds.length > 0) {
          const parties = await TransactionParty.query().whereIn('id', partyIds as number[])
          for (const party of parties) {
            if (!party.email) continue
            await mail.send(new OfferAcceptedMail({
              to: party.email,
              clientName: party.fullName,
              propertyAddress,
              language: null,
            }))
          }
        }
      } catch (acceptMailError) {
        logger.error({ acceptMailError, offerId: acceptedOffer.id }, 'Failed to send offer accepted email to parties — non-blocking')
      }

      const acceptLang = auth.user!.language?.substring(0, 2) || 'fr'
      try {
        await NotificationService.notify({
          userId: auth.user!.id,
          transactionId: transaction.id,
          type: 'offer_accepted',
          icon: '🎉',
          severity: 'info',
          title: acceptLang === 'fr'
            ? 'Offre acceptée'
            : 'Offer accepted',
          body: acceptLang === 'fr'
            ? 'La transaction avance automatiquement.'
            : 'Transaction advances automatically.',
          link: `/transactions/${transaction.id}`,
        })
      } catch (notifError) {
        logger.error({ notifError }, 'Failed to create offer accepted notification — non-blocking')
      }

      return response.ok({
        success: true,
        data: { offer: acceptedOffer, advanceResult },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Offer not found', code: 'E_NOT_FOUND' },
        })
      }
      if (error.message?.includes('Cannot accept') || error.message?.includes('expired')) {
        return response.badRequest({
          success: false,
          error: { message: error.message, code: 'E_INVALID_OFFER_STATUS' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to accept offer', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async reject({ params, response, auth }: HttpContext) {
    try {
      const { transaction } = await this.loadOfferBasicWithOwnershipCheck(
        params.offerId,
        auth.user!
      )

      const rejectedOffer = await OfferService.rejectOffer(params.offerId)

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'offer_rejected',
        metadata: { offerId: rejectedOffer.id },
      })

      // Email confirmation to broker
      try {
        await mail.send(new OfferRejectedMail({
          to: auth.user!.email,
          transactionId: transaction.id,
          offerId: rejectedOffer.id,
          language: auth.user!.language,
        }))
      } catch (mailError) {
        logger.error({ mailError, offerId: rejectedOffer.id }, 'Failed to send offer rejected email — non-blocking')
      }

      // Notification twin for the broker
      const rejectLang = auth.user!.language?.substring(0, 2) || 'fr'
      try {
        await NotificationService.notify({
          userId: auth.user!.id,
          transactionId: transaction.id,
          type: 'offer_rejected',
          icon: '❌',
          severity: 'info',
          title: rejectLang === 'fr'
            ? 'Offre refusée'
            : 'Offer rejected',
          body: undefined,
          link: `/transactions/${transaction.id}`,
        })
      } catch (notifError) {
        logger.error({ notifError }, 'Failed to create offer rejected notification — non-blocking')
      }

      return response.ok({
        success: true,
        data: { offer: rejectedOffer },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Offer not found', code: 'E_NOT_FOUND' },
        })
      }
      if (error.message?.includes('Cannot reject')) {
        return response.badRequest({
          success: false,
          error: { message: error.message, code: 'E_INVALID_OFFER_STATUS' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to reject offer', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async withdraw({ params, response, auth }: HttpContext) {
    try {
      const { transaction } = await this.loadOfferBasicWithOwnershipCheck(
        params.offerId,
        auth.user!
      )

      const withdrawnOffer = await OfferService.withdrawOffer(params.offerId)

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'offer_withdrawn',
        metadata: { offerId: withdrawnOffer.id },
      })

      // Email confirmation to broker
      try {
        await mail.send(new OfferWithdrawnMail({
          to: auth.user!.email,
          transactionId: transaction.id,
          offerId: withdrawnOffer.id,
          language: auth.user!.language,
        }))
      } catch (mailError) {
        logger.error({ mailError, offerId: withdrawnOffer.id }, 'Failed to send offer withdrawn email — non-blocking')
      }

      // Notification twin for the broker
      const withdrawLang = auth.user!.language?.substring(0, 2) || 'fr'
      try {
        await NotificationService.notify({
          userId: auth.user!.id,
          transactionId: transaction.id,
          type: 'offer_withdrawn',
          icon: '🚫',
          severity: 'info',
          title: withdrawLang === 'fr'
            ? 'Offre retirée'
            : 'Offer withdrawn',
          body: undefined,
          link: `/transactions/${transaction.id}`,
        })
      } catch (notifError) {
        logger.error({ notifError }, 'Failed to create offer withdrawn notification — non-blocking')
      }

      return response.ok({
        success: true,
        data: { offer: withdrawnOffer },
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Offer not found', code: 'E_NOT_FOUND' },
        })
      }
      if (error.message?.includes('Cannot withdraw')) {
        return response.badRequest({
          success: false,
          error: { message: error.message, code: 'E_INVALID_OFFER_STATUS' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to withdraw offer', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  async destroy({ params, response, auth }: HttpContext) {
    try {
      const { offer } = await this.loadOfferBasicWithOwnershipCheck(params.offerId, auth.user!)

      if (offer.status === 'accepted') {
        return response.badRequest({
          success: false,
          error: {
            message: 'Cannot delete an accepted offer',
            code: 'E_CANNOT_DELETE_ACCEPTED',
          },
        })
      }

      await offer.delete()
      return response.noContent()
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Offer not found', code: 'E_NOT_FOUND' },
        })
      }
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to delete offer', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
