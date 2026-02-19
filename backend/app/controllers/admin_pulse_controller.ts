import type { HttpContext } from '@adonisjs/core/http'
import { AdminPulseService } from '#services/admin_pulse_service'
import logger from '@adonisjs/core/services/logger'

export default class AdminPulseController {
  /**
   * GET /api/admin/pulse
   * Aggregated dashboard: KPIs + alerts + activity + conversion
   */
  async index({ response }: HttpContext) {
    try {
      const [kpis, alerts, activityFeed, conversionStats] = await Promise.all([
        AdminPulseService.getKpis(),
        AdminPulseService.getAlerts(),
        AdminPulseService.getActivityFeed(20),
        AdminPulseService.getConversionStats(),
      ])

      return response.ok({
        success: true,
        data: { kpis, alerts, activityFeed, conversionStats },
      })
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch pulse data')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to fetch pulse data', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
