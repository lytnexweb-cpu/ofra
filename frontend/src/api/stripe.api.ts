import { http } from './http'

export interface SetupIntentResponse {
  clientSecret: string
}

export interface SubscribeResponse {
  subscriptionId: string
  status: string
  currentPeriodEnd: number | null
  plan: { id: number; name: string; slug: string }
  billingCycle: 'monthly' | 'annual'
  lockedPrice: number | null
}

export interface CancelResponse {
  message: string
  cancelAt: number | null
  currentPeriodEnd: number | null
}

export const stripeApi = {
  createSetupIntent: () =>
    http.post<SetupIntentResponse>('/api/stripe/setup-intent'),

  subscribe: (planSlug: string, billingCycle?: 'monthly' | 'annual') =>
    http.post<SubscribeResponse>('/api/stripe/subscribe', { planSlug, billingCycle }),

  changePlan: (planSlug: string, billingCycle?: 'monthly' | 'annual') =>
    http.post<SubscribeResponse>('/api/stripe/change-plan', { planSlug, billingCycle }),

  cancel: () =>
    http.post<CancelResponse>('/api/stripe/cancel'),

  updatePaymentMethod: (paymentMethodId: string) =>
    http.put<{ message: string }>('/api/stripe/payment-method', { paymentMethodId }),
}
