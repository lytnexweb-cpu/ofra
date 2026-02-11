import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'
import Transaction from '#models/transaction'

/**
 * Plan limit middleware — soft limit with 7-day grace period
 *
 * Applied to transaction creation routes only.
 * - If user has no plan or plan has unlimited TX: pass through
 * - If active TX count < maxTransactions: pass through (reset grace if needed)
 * - If over limit and no grace started: start grace, allow creation
 * - If over limit and within 7-day grace: allow creation
 * - If over limit and grace expired (>7 days): block creation
 */
export default class PlanLimitMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized({
        success: false,
        error: { message: 'Authentication required', code: 'E_UNAUTHORIZED' },
      })
    }

    // Load plan if not already loaded
    await user.load('plan')
    const plan = user.plan

    // No plan assigned or unlimited transactions → pass through
    if (!plan || plan.maxTransactions === null) {
      return next()
    }

    // Count active transactions for this user
    const activeCount = await Transaction.query()
      .where('owner_user_id', user.id)
      .where('status', 'active')
      .count('* as total')
      .first()

    const count = Number(activeCount?.$extras?.total ?? 0)

    // Under limit → reset grace period if it was set, then pass
    if (count < plan.maxTransactions) {
      if (user.gracePeriodStart !== null) {
        user.gracePeriodStart = null
        await user.save()
      }
      return next()
    }

    // At or over limit — check grace period
    if (!user.gracePeriodStart) {
      // Start grace period now
      user.gracePeriodStart = DateTime.now()
      await user.save()
      // Allow this creation (grace just started)
      return next()
    }

    // Grace period active — check if expired (>7 days)
    const graceStart = user.gracePeriodStart
    const daysSinceGrace = DateTime.now().diff(graceStart, 'days').days

    if (daysSinceGrace > 7) {
      // Grace expired — block creation
      return ctx.response.forbidden({
        success: false,
        error: {
          message: 'Transaction limit reached. Please upgrade your plan.',
          code: 'E_PLAN_LIMIT_EXCEEDED',
          meta: {
            maxTransactions: plan.maxTransactions,
            activeTransactions: count,
            gracePeriodStart: graceStart.toISO(),
            graceExpired: true,
          },
        },
      })
    }

    // Within grace period — allow but warn
    return next()
  }
}
