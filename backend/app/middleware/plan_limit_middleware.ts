import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { DateTime } from 'luxon'
import Transaction from '#models/transaction'

/**
 * Plan limit middleware — handles both trial mode (D53) and paid plan limits.
 *
 * Applied to transaction creation routes.
 *
 * Trial mode (plan_id = null, subscription_status = 'trial'):
 *   - 1 TX max (trial_tx_used flag)
 *   - J0-J30: full Pro access
 *   - J30-J33: soft wall (read-only — blocked at route level by TrialGuardMiddleware)
 *   - J33+: hard wall (pricing only — blocked by TrialGuardMiddleware)
 *
 * Paid plan mode:
 *   - maxTransactions per plan with 7-day grace period
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

    // ── Trial mode (no plan assigned) ──
    if (!plan) {
      // Check if trial TX already used
      if (user.trialTxUsed) {
        return ctx.response.forbidden({
          success: false,
          error: {
            message: 'Trial limit reached: 1 transaction maximum. Choose a plan to continue.',
            code: 'E_TRIAL_TX_LIMIT',
            meta: { trialTxUsed: true, maxTrialTx: 1 },
          },
        })
      }

      // Check if trial has expired (J30+)
      if (user.subscriptionEndsAt && user.subscriptionEndsAt < DateTime.now()) {
        return ctx.response.forbidden({
          success: false,
          error: {
            message: 'Your trial has expired. Choose a plan to continue.',
            code: 'E_TRIAL_EXPIRED',
            meta: { trialExpired: true },
          },
        })
      }

      // Trial active and TX not used → allow
      return next()
    }

    // ── Paid plan mode ──

    // Unlimited transactions → pass through
    if (plan.maxTransactions === null) {
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
