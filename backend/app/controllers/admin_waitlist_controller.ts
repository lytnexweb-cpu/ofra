import type { HttpContext } from '@adonisjs/core/http'
import WaitlistEmail from '#models/waitlist_email'
import logger from '@adonisjs/core/services/logger'

export default class AdminWaitlistController {
  /**
   * GET /api/admin/waitlist
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = Number(request.input('page', 1))
      const limit = Math.min(Number(request.input('limit', 20)), 100)

      const waitlist = await WaitlistEmail.query()
        .orderBy('created_at', 'desc')
        .paginate(page, limit)

      return response.ok({
        success: true,
        data: {
          emails: waitlist.all(),
          meta: waitlist.getMeta(),
        },
      })
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch waitlist')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to fetch waitlist', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * GET /api/admin/waitlist/export
   * Export as CSV
   */
  async export({ response }: HttpContext) {
    try {
      const emails = await WaitlistEmail.query().orderBy('created_at', 'desc')

      const csvHeader = 'email,source,created_at\n'
      const csvRows = emails
        .map((e) => `${e.email},${e.source},${e.createdAt.toISO()}`)
        .join('\n')

      response.header('Content-Type', 'text/csv')
      response.header('Content-Disposition', 'attachment; filename="waitlist.csv"')
      return response.send(csvHeader + csvRows)
    } catch (error) {
      logger.error({ err: error }, 'Failed to export waitlist')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to export waitlist', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
