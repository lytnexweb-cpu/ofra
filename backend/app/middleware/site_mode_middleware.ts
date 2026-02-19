import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import SiteSetting from '#models/site_setting'

let cachedMode: string | null = null
let cacheTimestamp = 0
const CACHE_TTL = 30_000 // 30 seconds

/**
 * SiteMode middleware — controls access based on site_mode setting.
 * - live: pass through
 * - maintenance: admin/superadmin bypass, others get 503
 * - coming_soon: admin/superadmin bypass, cookie check, others get 403
 */
export default class SiteModeMiddleware {
  /**
   * Invalidate the in-memory cache (called after admin updates)
   */
  static invalidateCache() {
    cachedMode = null
    cacheTimestamp = 0
  }

  private async getSiteMode(): Promise<string> {
    const now = Date.now()
    if (cachedMode !== null && now - cacheTimestamp < CACHE_TTL) {
      return cachedMode
    }
    const mode = await SiteSetting.get('site_mode')
    cachedMode = mode || 'live'
    cacheTimestamp = now
    return cachedMode
  }

  async handle(ctx: HttpContext, next: NextFn) {
    const mode = await this.getSiteMode()

    if (mode === 'live') {
      return next()
    }

    // Admin/superadmin always bypass
    const user = ctx.auth.user
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      return next()
    }

    if (mode === 'maintenance') {
      return ctx.response.serviceUnavailable({
        success: false,
        error: {
          message: 'Site is under maintenance. Please try again later.',
          code: 'E_MAINTENANCE',
        },
      })
    }

    if (mode === 'coming_soon') {
      // Check access code cookie
      const validated = ctx.request.cookie('access_code_validated')
      if (validated === 'true') {
        return next()
      }

      return ctx.response.forbidden({
        success: false,
        error: {
          message: 'Site is coming soon. Please enter your access code.',
          code: 'E_COMING_SOON',
        },
      })
    }

    return next()
  }
}
