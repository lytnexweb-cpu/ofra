import { http } from './http'

export interface SiteInfo {
  siteMode: 'live' | 'coming_soon' | 'maintenance'
  launchDate: string | null
  pitchPoints: string[]
  showFounderCount: boolean
  founderCount: number
  customMessage: string
}

export const siteApi = {
  getSiteInfo: () => http.get<SiteInfo>('/api/public/site-info'),

  validateAccessCode: (code: string) =>
    http.post('/api/site/validate-code', { code }),

  joinWaitlist: (email: string) =>
    http.post<{ alreadyRegistered: boolean }>('/api/waitlist', { email }),

  validatePromoCode: (code: string) =>
    http.post<{ code: string; type: string; value: number; eligiblePlans: number[] | null }>(
      '/api/promo-codes/validate',
      { code }
    ),
}
