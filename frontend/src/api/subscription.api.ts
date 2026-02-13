import { http } from './http'

export interface SubscriptionPlan {
  id: number
  name: string
  slug: string
  maxTransactions: number | null
  maxStorageGb: number
  maxUsers: number
  historyMonths: number | null
}

export interface SubscriptionData {
  plan: SubscriptionPlan | null
  billing: {
    cycle: 'monthly' | 'annual'
    isFounder: boolean
    lockedPrice: number | null
    subscriptionStatus: string
    subscriptionStartedAt: string | null
    subscriptionEndsAt: string | null
  }
  usage: {
    activeTransactions: number
    maxTransactions: number | null
    storageUsedGb: number
    maxStorageGb: number
    pdfExportsThisMonth?: number
    pdfExportsLimit?: number | null
  }
  grace: {
    active: boolean
    startedAt: string | null
    daysRemaining: number | null
  }
}

export const subscriptionApi = {
  get: () => http.get<SubscriptionData>('/api/me/subscription'),
  changePlan: (planSlug: string, billingCycle?: 'monthly' | 'annual') =>
    http.post<SubscriptionData>('/api/me/plan', { planSlug, billingCycle }),
}
