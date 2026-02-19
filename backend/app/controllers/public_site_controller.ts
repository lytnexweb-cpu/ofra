import type { HttpContext } from '@adonisjs/core/http'
import SiteSetting from '#models/site_setting'
import User from '#models/user'

export default class PublicSiteController {
  /**
   * POST /api/site/validate-code
   * Validate access code for coming_soon mode
   */
  async validateCode({ request, response }: HttpContext) {
    const { code } = request.only(['code'])

    if (!code || typeof code !== 'string') {
      return response.unprocessableEntity({
        success: false,
        error: { message: 'Code is required', code: 'E_VALIDATION_FAILED' },
      })
    }

    const accessCode = await SiteSetting.get('access_code')

    if (!accessCode || code.trim() !== accessCode) {
      return response.unauthorized({
        success: false,
        error: { message: 'Invalid access code', code: 'E_INVALID_CODE' },
      })
    }

    // Set session cookie
    response.cookie('access_code_validated', 'true', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response.ok({ success: true })
  }

  /**
   * GET /api/public/site-info
   * Public info for Coming Soon / Maintenance pages
   */
  async getPublicInfo({ response }: HttpContext) {
    const settings = await SiteSetting.getAll()

    const founderCount = await User.query()
      .where('isFounder', true)
      .count('* as count')
      .first()

    return response.ok({
      success: true,
      data: {
        siteMode: settings['site_mode'] || 'live',
        launchDate: settings['launch_date'] || null,
        pitchPoints: settings['pitch_points'] ? JSON.parse(settings['pitch_points']) : [],
        showFounderCount: settings['show_founder_count'] === 'true',
        founderCount: Number(founderCount?.$extras.count || 0),
        customMessage: settings['custom_message'] || '',
      },
    })
  }

  /**
   * POST /api/waitlist
   * Join the email waitlist
   */
  async joinWaitlist({ request, response }: HttpContext) {
    const { email } = request.only(['email'])

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return response.unprocessableEntity({
        success: false,
        error: { message: 'Valid email is required', code: 'E_VALIDATION_FAILED' },
      })
    }

    // Dynamic import to avoid circular deps — model created in Sprint B
    const { default: WaitlistEmail } = await import('#models/waitlist_email')

    const existing = await WaitlistEmail.query().where('email', email.trim().toLowerCase()).first()
    if (existing) {
      return response.ok({ success: true, data: { alreadyRegistered: true } })
    }

    await WaitlistEmail.create({
      email: email.trim().toLowerCase(),
      source: 'coming_soon_page',
    })

    return response.created({ success: true, data: { alreadyRegistered: false } })
  }
}
