import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'

/**
 * D53 Trial Guard — enforces soft wall and hard wall for expired trials.
 *
 * Applied to all authenticated routes.
 *
 * - Active trial or paid plan → pass through
 * - Soft wall (J30-J33): read-only — block POST/PUT/PATCH/DELETE, allow GET
 * - Hard wall (J33+): only /me, /logout, /me/subscription, /me/plan allowed
 */
export default class TrialGuardMiddleware {
  // Routes always allowed (even during hard wall)
  private static readonly ALWAYS_ALLOWED = [
    '/api/me',
    '/api/logout',
    '/api/me/subscription',
    '/api/me/plan',
    '/api/plans',
    '/api/notifications',
    '/api/notifications/unread-count',
  ]

  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user) return next()

    // Paid plan or non-trial status → no wall
    if (user.planId || user.subscriptionStatus === 'active') {
      return next()
    }

    // No trial end date set → pass (legacy user or not yet initialized)
    if (!user.subscriptionEndsAt) {
      return next()
    }

    const now = DateTime.now()
    const trialEnd = user.subscriptionEndsAt
    const softWallEnd = trialEnd.plus({ days: 3 })

    // Trial still active (before J30) → pass
    if (now < trialEnd) {
      return next()
    }

    // Always allow specific routes
    const path = ctx.request.url().split('?')[0]
    if (TrialGuardMiddleware.ALWAYS_ALLOWED.some((p) => path === p || path.startsWith(p + '/'))) {
      return next()
    }

    // Hard wall (J33+) — only allowed routes pass
    if (now >= softWallEnd) {
      return ctx.response.forbidden({
        success: false,
        error: {
          message: 'Your trial has expired. Please choose a plan to continue.',
          code: 'E_TRIAL_HARD_WALL',
          meta: {
            trialEndsAt: trialEnd.toISO(),
            hardWall: true,
          },
        },
      })
    }

    // Soft wall (J30-J33) — read-only: allow GET, block mutations
    if (ctx.request.method() !== 'GET') {
      return ctx.response.forbidden({
        success: false,
        error: {
          message: 'Your trial has ended. Your data is safe — choose a plan to continue editing.',
          code: 'E_TRIAL_SOFT_WALL',
          meta: {
            trialEndsAt: trialEnd.toISO(),
            softWall: true,
            daysUntilHardWall: Math.ceil(softWallEnd.diff(now, 'days').days),
          },
        },
      })
    }

    // GET during soft wall → allow (read-only)
    return next()
  }
}
