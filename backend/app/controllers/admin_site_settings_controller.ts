import type { HttpContext } from '@adonisjs/core/http'
import SiteSetting from '#models/site_setting'
import SiteModeMiddleware from '#middleware/site_mode_middleware'
import { updateSiteSettingsValidator } from '#validators/site_setting_validator'
import logger from '@adonisjs/core/services/logger'

export default class AdminSiteSettingsController {
  /**
   * GET /api/admin/site-settings
   */
  async index({ response }: HttpContext) {
    try {
      const settings = await SiteSetting.getAll()
      return response.ok({ success: true, data: settings })
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch site settings')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to fetch site settings', code: 'E_INTERNAL_ERROR' },
      })
    }
  }

  /**
   * PUT /api/admin/site-settings
   */
  async update({ request, response, auth }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateSiteSettingsValidator)
      const userId = auth.user!.id

      const keyMap: Record<string, string> = {
        site_mode: 'site_mode',
        access_code: 'access_code',
        custom_message: 'custom_message',
        launch_date: 'launch_date',
        pitch_points: 'pitch_points',
        show_founder_count: 'show_founder_count',
      }

      for (const [field, dbKey] of Object.entries(keyMap)) {
        const value = (payload as any)[field]
        if (value !== undefined) {
          await SiteSetting.set(dbKey, value === null ? '' : String(value), userId)
        }
      }

      // Invalidate middleware cache
      SiteModeMiddleware.invalidateCache()

      const settings = await SiteSetting.getAll()
      return response.ok({ success: true, data: settings })
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
      logger.error({ err: error }, 'Failed to update site settings')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to update site settings', code: 'E_INTERNAL_ERROR' },
      })
    }
  }
}
