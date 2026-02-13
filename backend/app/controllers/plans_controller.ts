import type { HttpContext } from '@adonisjs/core/http'
import Plan from '#models/plan'

export default class PlansController {
  /**
   * GET /api/plans (public, no auth)
   * Returns active plans for pricing page display
   */
  async index({ response }: HttpContext) {
    const plans = await Plan.query()
      .where('isActive', true)
      .orderBy('display_order', 'asc')
      .select([
        'id',
        'name',
        'slug',
        'monthly_price',
        'annual_price',
        'max_transactions',
        'max_storage_gb',
        'max_users',
        'history_months',
        'display_order',
      ])

    return response.ok({
      success: true,
      data: {
        plans: plans.map((p) => p.serialize()),
        discounts: {
          annual: 0.17,
          founder: 0.20,
          founderAnnual: 0.30,
        },
      },
    })
  }
}
