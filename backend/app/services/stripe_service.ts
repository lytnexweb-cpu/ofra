import Stripe from 'stripe'
import env from '#start/env'
import User from '#models/user'
import Plan from '#models/plan'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import SubscriptionConfirmationMail from '#mails/subscription_confirmation_mail'
import PlanChangedMail from '#mails/plan_changed_mail'
import logger from '@adonisjs/core/services/logger'

// Discount rates matching plans_controller.ts and PricingPage
const DISCOUNT_FOUNDER = 0.20
const DISCOUNT_FOUNDER_ANNUAL = 0.30

export default class StripeService {
  private static stripe: Stripe | null = null

  static getClient(): Stripe {
    if (!this.stripe) {
      const secretKey = env.get('STRIPE_SECRET_KEY')
      if (!secretKey) {
        throw new Error('STRIPE_SECRET_KEY is not configured')
      }
      this.stripe = new Stripe(secretKey)
    }
    return this.stripe
  }

  /**
   * Calculate the price to charge based on plan, billing cycle, and founder status.
   * Returns the amount in dollars (not cents).
   */
  static calculatePrice(
    plan: Plan,
    billingCycle: 'monthly' | 'annual',
    isFounder: boolean
  ): number {
    if (isFounder) {
      if (billingCycle === 'annual') {
        // 30% off the standard annual price
        return Math.round(plan.monthlyPrice * 12 * (1 - DISCOUNT_FOUNDER_ANNUAL))
      }
      // 20% off monthly
      return Math.round(plan.monthlyPrice * (1 - DISCOUNT_FOUNDER) * 100) / 100
    }

    // Non-founder
    if (billingCycle === 'annual') {
      return plan.annualPrice
    }
    return plan.monthlyPrice
  }

  /**
   * Get or create a Stripe Customer for a user.
   */
  static async getOrCreateCustomer(user: User): Promise<string> {
    if (user.stripeCustomerId) {
      return user.stripeCustomerId
    }

    const customer = await this.getClient().customers.create({
      email: user.email,
      name: user.fullName ?? undefined,
      metadata: { userId: String(user.id) },
    })

    user.stripeCustomerId = customer.id
    await user.save()
    return customer.id
  }

  /**
   * Create a SetupIntent to collect payment method via Stripe Elements.
   */
  static async createSetupIntent(user: User): Promise<Stripe.SetupIntent> {
    const customerId = await this.getOrCreateCustomer(user)
    return this.getClient().setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    })
  }

  /**
   * Attach a payment method and set it as default.
   */
  static async attachPaymentMethod(user: User, paymentMethodId: string): Promise<void> {
    const stripe = this.getClient()
    const customerId = await this.getOrCreateCustomer(user)

    // Attach to customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })

    // Set as default for invoices
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Update subscription default if one exists
    if (user.stripeSubscriptionId) {
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        default_payment_method: paymentMethodId,
      })
    }

    user.stripePaymentMethodId = paymentMethodId
    await user.save()
  }

  /**
   * Create a Stripe Price dynamically for the given plan and amount.
   */
  private static async createStripePrice(
    plan: Plan,
    amountDollars: number,
    billingCycle: 'monthly' | 'annual'
  ): Promise<Stripe.Price> {
    if (!plan.stripeProductId) {
      throw new Error(`Plan "${plan.slug}" has no stripe_product_id configured`)
    }

    return this.getClient().prices.create({
      product: plan.stripeProductId,
      unit_amount: Math.round(amountDollars * 100), // cents
      currency: 'cad',
      recurring: {
        interval: billingCycle === 'annual' ? 'year' : 'month',
      },
    })
  }

  /**
   * Create a subscription for a user.
   * The user must already have a payment method attached.
   */
  static async createSubscription(
    user: User,
    plan: Plan,
    billingCycle: 'monthly' | 'annual'
  ): Promise<Stripe.Subscription> {
    if (!user.stripePaymentMethodId) {
      throw new Error('User has no payment method attached')
    }

    const customerId = await this.getOrCreateCustomer(user)
    const price = this.calculatePrice(plan, billingCycle, user.isFounder)
    const stripePrice = await this.createStripePrice(plan, price, billingCycle)

    const subscription = await this.getClient().subscriptions.create({
      customer: customerId,
      items: [{ price: stripePrice.id }],
      default_payment_method: user.stripePaymentMethodId,
      metadata: {
        userId: String(user.id),
        planSlug: plan.slug,
        billingCycle,
        isFounder: String(user.isFounder),
      },
    })

    // Update local user state
    user.stripeSubscriptionId = subscription.id
    user.planId = plan.id
    user.billingCycle = billingCycle
    user.planLockedPrice = price
    user.subscriptionStatus = 'active'
    user.subscriptionStartedAt = DateTime.now()
    const periodEnd = subscription.items.data[0]?.current_period_end
    if (periodEnd) {
      user.subscriptionEndsAt = DateTime.fromSeconds(periodEnd)
    }
    user.gracePeriodStart = null
    await user.save()

    // Send confirmation email (non-blocking)
    mail
      .send(new SubscriptionConfirmationMail({
        to: user.email,
        userName: user.fullName ?? user.email,
        planName: plan.name,
        price,
        billingCycle,
        isFounder: user.isFounder,
        language: user.language,
      }))
      .catch((err) => logger.error({ err }, 'Failed to send subscription confirmation email'))

    return subscription
  }

  /**
   * Change plan (upgrade/downgrade) with Stripe prorating.
   */
  static async changePlan(
    user: User,
    plan: Plan,
    billingCycle: 'monthly' | 'annual'
  ): Promise<Stripe.Subscription> {
    if (!user.stripeSubscriptionId) {
      throw new Error('User has no active Stripe subscription')
    }

    // Load previous plan name before changing
    const previousPlan = user.planId
      ? await Plan.find(user.planId)
      : null
    const previousPlanName = previousPlan?.name ?? '—'
    const previousPlanOrder = previousPlan?.displayOrder ?? 0

    const stripe = this.getClient()
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)

    const price = this.calculatePrice(plan, billingCycle, user.isFounder)
    const stripePrice = await this.createStripePrice(plan, price, billingCycle)

    const updated = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: stripePrice.id,
        },
      ],
      proration_behavior: 'create_prorations',
      metadata: {
        userId: String(user.id),
        planSlug: plan.slug,
        billingCycle,
        isFounder: String(user.isFounder),
      },
    })

    // Update local state
    user.planId = plan.id
    user.billingCycle = billingCycle
    user.planLockedPrice = price
    user.gracePeriodStart = null
    await user.save()

    // Send plan changed email (non-blocking)
    mail
      .send(new PlanChangedMail({
        to: user.email,
        userName: user.fullName ?? user.email,
        previousPlanName,
        newPlanName: plan.name,
        newPrice: price,
        billingCycle,
        isUpgrade: plan.displayOrder > previousPlanOrder,
        language: user.language,
      }))
      .catch((err) => logger.error({ err }, 'Failed to send plan changed email'))

    return updated
  }

  /**
   * Cancel subscription at period end.
   */
  static async cancelSubscription(user: User): Promise<Stripe.Subscription> {
    if (!user.stripeSubscriptionId) {
      throw new Error('User has no active Stripe subscription')
    }

    const updated = await this.getClient().subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    user.subscriptionStatus = 'cancelled'
    await user.save()

    return updated
  }

  /**
   * Verify and construct a Stripe webhook event.
   */
  static constructEvent(rawBody: string, signature: string): Stripe.Event {
    const webhookSecret = env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
    }
    return this.getClient().webhooks.constructEvent(rawBody, signature, webhookSecret)
  }

  /**
   * Handle a Stripe webhook event.
   */
  static async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'invoice.paid':
        await this.onInvoicePaid(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await this.onInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case 'customer.subscription.updated':
        await this.onSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await this.onSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
    }
  }

  private static getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
    const sub = invoice.parent?.subscription_details?.subscription
    if (!sub) return null
    return typeof sub === 'string' ? sub : sub.id
  }

  private static async onInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const subId = this.getSubscriptionIdFromInvoice(invoice)
    if (!subId) return
    const user = await User.findBy('stripeSubscriptionId', subId)
    if (!user) return

    user.subscriptionStatus = 'active'
    await user.save()
  }

  private static async onInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subId = this.getSubscriptionIdFromInvoice(invoice)
    if (!subId) return
    const user = await User.findBy('stripeSubscriptionId', subId)
    if (!user) return

    user.subscriptionStatus = 'past_due'
    await user.save()
  }

  private static async onSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const user = await User.findBy('stripeSubscriptionId', subscription.id)
    if (!user) return

    // Sync status
    if (subscription.status === 'active') {
      user.subscriptionStatus = 'active'
    } else if (subscription.status === 'past_due') {
      user.subscriptionStatus = 'past_due'
    } else if (subscription.status === 'canceled') {
      user.subscriptionStatus = 'cancelled'
    }

    // Update period end from first subscription item
    const periodEnd = subscription.items.data[0]?.current_period_end
    if (periodEnd) {
      user.subscriptionEndsAt = DateTime.fromSeconds(periodEnd)
    }

    await user.save()
  }

  private static async onSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const user = await User.findBy('stripeSubscriptionId', subscription.id)
    if (!user) return

    user.subscriptionStatus = 'expired'
    user.stripeSubscriptionId = null
    await user.save()
  }
}
