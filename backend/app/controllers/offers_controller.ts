import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Transaction from '#models/transaction'
import Offer from '#models/offer'
import { OfferService } from '#services/offer_service'
import { ActivityFeedService } from '#services/activity_feed_service'
import { TenantScopeService } from '#services/tenant_scope_service'
import {
  createOfferValidator,
  addRevisionValidator,
} from '#validators/offer_validator'

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
        direction: payload.direction || 'buyer_to_seller',
        createdByUserId: auth.user!.id,
      })

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'offer_created',
        metadata: { offerId: offer.id, price: payload.price },
      })

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
        query.preload('createdBy').orderBy('revision_number', 'asc')
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
      })

      // Refresh offer to get updated status
      await offer.refresh()
      await offer.load('revisions', (query) => query.orderBy('revision_number', 'asc'))

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

      const acceptedOffer = await OfferService.acceptOffer(params.offerId)

      await ActivityFeedService.log({
        transactionId: transaction.id,
        userId: auth.user!.id,
        activityType: 'offer_accepted',
        metadata: { offerId: acceptedOffer.id },
      })

      return response.ok({
        success: true,
        data: { offer: acceptedOffer },
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
