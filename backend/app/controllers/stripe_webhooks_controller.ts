import type { HttpContext } from '@adonisjs/core/http'
import StripeService from '#services/stripe_service'

export default class StripeWebhooksController {
  /**
   * POST /api/webhooks/stripe
   * Handle Stripe webhook events with signature verification.
   */
  async handle({ request, response }: HttpContext) {
    const signature = request.header('stripe-signature')
    if (!signature) {
      return response.badRequest({
        success: false,
        error: { message: 'Missing stripe-signature header' },
      })
    }

    const rawBody = request.raw()
    if (!rawBody) {
      return response.badRequest({
        success: false,
        error: { message: 'Empty request body' },
      })
    }

    try {
      const event = StripeService.constructEvent(rawBody, signature)
      await StripeService.handleWebhookEvent(event)

      return response.ok({ received: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Webhook processing failed'
      return response.badRequest({
        success: false,
        error: { message: `Webhook error: ${message}` },
      })
    }
  }
}
