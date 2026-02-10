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

  accept: (offerId: number) =>
    http.patch<{ offer: Offer }>(`/api/offers/${offerId}/accept`, {}),

  reject: (offerId: number) =>
    http.patch<{ offer: Offer }>(`/api/offers/${offerId}/reject`, {}),

  withdraw: (offerId: number) =>
    http.patch<{ offer: Offer }>(`/api/offers/${offerId}/withdraw`, {}),

  delete: (offerId: number) =>
    http.delete<{}>(`/api/offers/${offerId}`),
}
