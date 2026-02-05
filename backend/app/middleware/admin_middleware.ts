import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Admin middleware to protect admin routes
 * Requires user to have 'admin' or 'superadmin' role
 */
export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.unauthorized({
        success: false,
        error: { message: 'Authentication required', code: 'E_UNAUTHORIZED' },
      })
    }

    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return ctx.response.forbidden({
        success: false,
        error: { message: 'Admin access required', code: 'E_FORBIDDEN' },
      })
    }

    return next()
  }
}
