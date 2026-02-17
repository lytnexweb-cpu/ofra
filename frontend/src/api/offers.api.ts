import { http } from './http'
import type { Offer, OfferRevision } from './transactions.api'

export interface CreateOfferRequest {
  price: number
  deposit?: number | null
  depositDeadline?: string | null
  closingDate?: string | null
  financingAmount?: number | null
  expiryAt?: string | null
  direction: 'buyer_to_seller' | 'seller_to_buyer'
  notes?: string | null
  inspectionRequired?: boolean
  inspectionDelay?: number | null
  inclusions?: string | null
  message?: string | null
  conditionIds?: number[]
  fromPartyId?: number
  toPartyId?: number
  buyerPartyId?: number
  sellerPartyId?: number
}

export interface AddRevisionRequest {
  price: number
  deposit?: number | null
  depositDeadline?: string | null
  closingDate?: string | null
  financingAmount?: number | null
  expiryAt?: string | null
  direction: 'buyer_to_seller' | 'seller_to_buyer'
  notes?: string | null
  inspectionRequired?: boolean
  inspectionDelay?: number | null
  inclusions?: string | null
  message?: string | null
  conditionIds?: number[]
  fromPartyId?: number
  toPartyId?: number
}

export const offersApi = {
  list: (transactionId: number) =>
    http.get<{ offers: Offer[] }>(`/api/transactions/${transactionId}/offers`),

  get: (offerId: number) =>
    http.get<{ offer: Offer }>(`/api/offers/${offerId}`),

  create: (transactionId: number, data: CreateOfferRequest) =>
    http.post<{ offer: Offer }>(`/api/transactions/${transactionId}/offers`, data),

  addRevision: (offerId: number, data: AddRevisionRequest) =>
    http.post<{ revision: OfferRevision }>(`/api/offers/${offerId}/revisions`, data),

  accept: async (offerId: number) => {
    const result = await http.patch<{ offer: Offer }>(`/api/offers/${offerId}/accept`, {})
    if (!result.success) throw new Error(result.error?.message || 'Failed to accept offer')
    return result
  },

  reject: async (offerId: number) => {
    const result = await http.patch<{ offer: Offer }>(`/api/offers/${offerId}/reject`, {})
    if (!result.success) throw new Error(result.error?.message || 'Failed to reject offer')
    return result
  },

  withdraw: async (offerId: number) => {
    const result = await http.patch<{ offer: Offer }>(`/api/offers/${offerId}/withdraw`, {})
    if (!result.success) throw new Error(result.error?.message || 'Failed to withdraw offer')
    return result
  },

  delete: (offerId: number) =>
    http.delete<{}>(`/api/offers/${offerId}`),
}
