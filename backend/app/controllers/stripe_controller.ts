import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import Plan from '#models/plan'
import Transaction from '#models/transaction'
import StripeService from '#services/stripe_service'
import {
  subscribeValidator,
  changePlanStripeValidator,
  updatePaymentMethodValidator,
} from '#validators/stripe_validator'

export default class StripeController {
  /**
   * POST /api/stripe/setup-intent
   * Create a SetupIntent to collect card via Stripe Elements.
   */
  async setupIntent({ response, auth }: HttpContext) {
    const user = auth.user!

    try {
      const setupIntent = await StripeService.createSetupIntent(user)

      return response.ok({
        success: true,
        data: {
          clientSecret: setupIntent.client_secret,
        },
      })
    } catch (error) {
      logger.error({ err: error }, 'Stripe setupIntent failed')
      return response.internalServerError({
        success: false,
        error: { message: 'Failed to create setup intent', code: 'E_STRIPE_ERROR' },
      })
    }
  }

  /**
   * POST /api/stripe/subscribe
   * Create a Stripe subscription after card is collected.
   */
  async subscribe({ request, response, auth }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(subscribeValidator)

    // Must have a payment method
    if (!user.stripePaymentMethodId) {
      return response.unprocessableEntity({
        success: false,
        error: {
          message: 'Please add a payment method first',
          code: 'E_NO_PAYMENT_METHOD',
        },
      })
    }

    // Already has an active subscription?
    if (user.stripeSubscriptionId && user.subscriptionStatus === 'active') {
      return response.conflict({
        success: false,
        error: {
          message: 'You already have an active subscription. Use change-plan instead.',
          code: 'E_ALREADY_SUBSCRIBED',
        },
      })
    }

    // Find the plan
    const plan = await Plan.query()
      .where('slug', payload.planSlug)
      .where('isActive', true)
      .first()

    if (!plan) {
      return response.notFound({
        success: false,
        error: { message: 'Plan not found', code: 'E_NOT_FOUND' },
      })
    }

    if (!plan.stripeProductId) {
      return response.internalServerError({
        success: false,
        error: { message: 'Plan is not configured for billing', code: 'E_PLAN_NOT_CONFIGURED' },
      })
    }

    const billingCycle = payload.billingCycle ?? user.billingCycle ?? 'monthly'

    try {
      const subscription = await StripeService.createSubscription(user, plan, billingCycle)

      return response.ok({
        success: true,
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
          plan: { id: plan.id, name: plan.name, slug: plan.slug },
          billingCycle,
          lockedPrice: user.planLockedPrice,
        },
      })
    } catch (error) {
      logger.error({ err: error, planSlug: payload.planSlug, billingCycle }, 'Stripe subscribe failed')
      const message = error instanceof Error ? error.message : 'Subscription creation failed'
      return response.internalServerError({
        success: false,
        error: { message, code: 'E_STRIPE_ERROR' },
      })
    }
  }

  /**
   * POST /api/stripe/change-plan
   * Upgrade or downgrade with Stripe prorating.
   */
  async changePlan({ request, response, auth }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(changePlanStripeValidator)

    if (!user.stripeSubscriptionId) {
      return response.unprocessableEntity({
        success: false,
        error: {
          message: 'No active subscription. Use subscribe first.',
          code: 'E_NO_SUBSCRIPTION',
        },
      })
    }

    const plan = await Plan.query()
      .where('slug', payload.planSlug)
      .where('isActive', true)
      .first()

    if (!plan) {
      return response.notFound({
        success: false,
        error: { message: 'Plan not found', code: 'E_NOT_FOUND' },
      })
    }

    if (!plan.stripeProductId) {
      return response.internalServerError({
        success: false,
        error: { message: 'Plan is not configured for billing', code: 'E_PLAN_NOT_CONFIGURED' },
      })
    }

    // Downgrade check: block if too many active TX
    if (plan.maxTransactions !== null) {
      const activeResult = await Transaction.query()
        .where('owner_user_id', user.id)
        .where('status', 'active')
        .count('* as total')
        .first()
      const activeTx = Number(activeResult?.$extras?.total ?? 0)

      if (activeTx > plan.maxTransactions) {
        return response.unprocessableEntity({
          success: false,
          error: {
            message: 'Too many active transactions for this plan',
            code: 'E_DOWNGRADE_BLOCKED',
            meta: {
              activeTransactions: activeTx,
              maxTransactions: plan.maxTransactions,
              archiveNeeded: activeTx - plan.maxTransactions,
            },
          },
        })
      }
    }

    const billingCycle = payload.billingCycle ?? user.billingCycle

    try {
      const subscription = await StripeService.changePlan(user, plan, billingCycle)

      return response.ok({
        success: true,
        data: {
          subscriptionId: subscription.id,
          status: subscription.status,
          plan: { id: plan.id, name: plan.name, slug: plan.slug },
          billingCycle,
          lockedPrice: user.planLockedPrice,
        },
      })
    } catch (error) {
      logger.error({ err: error, planSlug: payload.planSlug }, 'Stripe changePlan failed')
      const message = error instanceof Error ? error.message : 'Plan change failed'
      return response.internalServerError({
        success: false,
        error: { message, code: 'E_STRIPE_ERROR' },
      })
    }
  }

  /**
   * POST /api/stripe/cancel
   * Cancel subscription at end of billing period.
   */
  async cancel({ response, auth }: HttpContext) {
    const user = auth.user!

    if (!user.stripeSubscriptionId) {
      return response.unprocessableEntity({
        success: false,
        error: {
          message: 'No active subscription to cancel',
          code: 'E_NO_SUBSCRIPTION',
        },
      })
    }

    try {
      const subscription = await StripeService.cancelSubscription(user)

      return response.ok({
        success: true,
        data: {
          message: 'Subscription will be cancelled at end of billing period',
          cancelAt: subscription.cancel_at,
          currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
        },
      })
    } catch (error) {
      logger.error({ err: error }, 'Stripe cancel failed')
      const message = error instanceof Error ? error.message : 'Cancellation failed'
      return response.internalServerError({
        success: false,
        error: { message, code: 'E_STRIPE_ERROR' },
      })
    }
  }

  /**
   * PUT /api/stripe/payment-method
   * Update the user's default payment method.
   */
  async updatePaymentMethod({ request, response, auth }: HttpContext) {
    const user = auth.user!
    const payload = await request.validateUsing(updatePaymentMethodValidator)

    try {
      await StripeService.attachPaymentMethod(user, payload.paymentMethodId)

      return response.ok({
        success: true,
        data: { message: 'Payment method updated' },
      })
    } catch (error) {
      logger.error({ err: error }, 'Stripe updatePaymentMethod failed')
      const message = error instanceof Error ? error.message : 'Failed to update payment method'
      return response.internalServerError({
        success: false,
        error: { message, code: 'E_STRIPE_ERROR' },
      })
    }
  }
}
