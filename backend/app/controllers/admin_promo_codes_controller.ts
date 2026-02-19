import type { HttpContext } from '@adonisjs/core/http'
import PromoCode from '#models/promo_code'
import { createPromoCodeValidator, updatePromoCodeValidator } from '#validators/promo_code_validator'
import logger from '@adonisjs/core/services/logger'

export default class AdminPromoCodesController {
  /**
   * GET /api/admin/promo-codes
   */
  async index({ response }: HttpContext) {
    try {
      const promoCodes = await PromoCode.query().orderBy('created_at', 'desc')
      return response.ok({ success: true, data: promoCodes })
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch promo codes')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to fetch promo codes', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * POST /api/admin/promo-codes
   */
  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createPromoCodeValidator)

      const promoCode = await PromoCode.create({
        code: payload.code.toUpperCase(),
        type: payload.type,
        value: payload.value,
        maxUses: payload.maxUses ?? null,
        validFrom: payload.validFrom ?? null,
        validUntil: payload.validUntil ?? null,
        eligiblePlans: payload.eligiblePlans ? JSON.parse(payload.eligiblePlans) : null,
        stripeCouponId: payload.stripeCouponId ?? null,
      })

      return response.created({ success: true, data: promoCode })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({
          success: false,
          error: { message: 'Validation failed', code: 'E_VALIDATION_FAILED', details: error.messages },
        })
      }
      if (error.code === '23505') {
        return response.conflict({
          success: false,
          error: { message: 'Promo code already exists', code: 'E_DUPLICATE' },
        })
      }
      logger.error({ err: error }, 'Failed to create promo code')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to create promo code', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * PUT /api/admin/promo-codes/:id
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const promoCode = await PromoCode.findOrFail(params.id)
      const payload = await request.validateUsing(updatePromoCodeValidator)

      if (payload.code !== undefined) promoCode.code = payload.code.toUpperCase()
      if (payload.type !== undefined) promoCode.type = payload.type
      if (payload.value !== undefined) promoCode.value = payload.value
      if (payload.maxUses !== undefined) promoCode.maxUses = payload.maxUses ?? null
      if (payload.validFrom !== undefined) promoCode.validFrom = payload.validFrom ?? null
      if (payload.validUntil !== undefined) promoCode.validUntil = payload.validUntil ?? null
      if (payload.eligiblePlans !== undefined) {
        promoCode.eligiblePlans = payload.eligiblePlans ? JSON.parse(payload.eligiblePlans) : null
      }
      if (payload.active !== undefined) promoCode.active = payload.active
      if (payload.stripeCouponId !== undefined) promoCode.stripeCouponId = payload.stripeCouponId ?? null

      await promoCode.save()

      return response.ok({ success: true, data: promoCode })
    } catch (error) {
      if (error.messages) {
        return response.unprocessableEntity({
          success: false,
          error: { message: 'Validation failed', code: 'E_VALIDATION_FAILED', details: error.messages },
        })
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Promo code not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ err: error, promoId: params.id }, 'Failed to update promo code')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to update promo code', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * DELETE /api/admin/promo-codes/:id
   * Soft-deactivate (set active=false)
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const promoCode = await PromoCode.findOrFail(params.id)
      promoCode.active = false
      await promoCode.save()

      return response.ok({ success: true, data: { message: 'Promo code deactivated' } })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          success: false,
          error: { message: 'Promo code not found', code: 'E_NOT_FOUND' },
        })
      }
      logger.error({ err: error, promoId: params.id }, 'Failed to delete promo code')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to delete promo code', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
