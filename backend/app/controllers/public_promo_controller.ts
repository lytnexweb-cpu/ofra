import type { HttpContext } from '@adonisjs/core/http'
import PromoCode from '#models/promo_code'
import { validatePromoCodeValidator } from '#validators/promo_code_validator'

export default class PublicPromoController {
  /**
   * POST /api/promo-codes/validate
   * Public endpoint to validate a promo code during registration
   */
  async validate({ request, response }: HttpContext) {
    const payload = await request.validateUsing(validatePromoCodeValidator)

    const promo = await PromoCode.query()
      .where('code', payload.code.toUpperCase())
      .first()

    if (!promo || !promo.isValid()) {
      return response.notFound({
        success: false,
        error: { message: 'Invalid or expired promo code', code: 'E_INVALID_PROMO' },
      })
    }

    return response.ok({
      success: true,
      data: {
        code: promo.code,
        type: promo.type,
        value: promo.value,
        eligiblePlans: promo.eligiblePlans,
      },
    })
  }
}
