import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Superadmin middleware to protect superadmin-only routes
 * Requires user to have 'superadmin' role
 */
export default class SuperadminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.unauthorized({
        success: false,
        error: { message: 'Authentication required', code: 'E_UNAUTHORIZED' },
      })
    }

    if (user.role !== 'superadmin') {
      return ctx.response.forbidden({
        success: false,
        error: { message: 'Superadmin access required', code: 'E_FORBIDDEN' },
      })
    }

    return next()
  }
}
