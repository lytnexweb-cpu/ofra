import { http } from './http'

export interface PublicPlan {
  id: number
  name: string
  slug: string
  monthlyPrice: number
  annualPrice: number
  maxTransactions: number | null // null = unlimited
  maxStorageGb: number
  maxUsers: number
  historyMonths: number | null // null = unlimited
  displayOrder: number
}

export interface PlansDiscounts {
  annual: number
  founder: number
  founderAnnual: number
}

export const plansApi = {
  list: () =>
    http.get<{ plans: PublicPlan[]; discounts: PlansDiscounts }>('/api/plans'),
}
