import { http, type ApiResponse } from './http'

export interface OfferIntakeInfo {
  property: {
    address: string
    city: string
    postalCode: string
  } | null
  listPrice: number | null
  type: string
  brokerName: string | null
}

export interface OfferIntakeSubmission {
  fullName: string
  email: string
  phone?: string
  price: number
  message?: string
  // Phase B enriched fields
  deposit?: number
  depositDeadline?: string
  closingDate?: string
  financingAmount?: number
  inspectionRequired?: boolean
  inspectionDelay?: string
  inclusions?: string
}

export interface OfferIntakeSubmitResponse {
  message: string
  offerId: number
}

// Phase C — negotiation types
export interface IntakeRevision {
  revisionNumber: number
  price: number
  deposit: number | null
  financingAmount: number | null
  depositDeadline: string | null
  closingDate: string | null
  inspectionRequired: boolean
  inspectionDelay: string | null
  inclusions: string | null
  message: string | null
  direction: 'buyer_to_seller' | 'seller_to_buyer'
  fromName: string | null
  toName: string | null
  createdAt: string
}

export interface OfferIntakeStatus {
  offerId: number
  status: string
  waitingFor: 'buyer' | 'seller'
  buyerName: string | null
  sellerName: string | null
  revisions: IntakeRevision[]
}

export interface OfferIntakeRespondPayload {
  price: number
  message?: string
  deposit?: number
  depositDeadline?: string
  closingDate?: string
  financingAmount?: number
  inspectionRequired?: boolean
  inspectionDelay?: string
  inclusions?: string
}

export const offerIntakeApi = {
  getInfo: (token: string): Promise<ApiResponse<OfferIntakeInfo>> =>
    http.get(`/api/offer-intake/${token}`),

  submit: (token: string, data: OfferIntakeSubmission): Promise<ApiResponse<OfferIntakeSubmitResponse>> =>
    http.post(`/api/offer-intake/${token}`, data),

  // Phase C
  getStatus: (token: string, offerId: number): Promise<ApiResponse<OfferIntakeStatus>> =>
    http.get(`/api/offer-intake/${token}/status/${offerId}`),

  respond: (token: string, offerId: number, data: OfferIntakeRespondPayload): Promise<ApiResponse<{ message: string; revisionNumber: number }>> =>
    http.post(`/api/offer-intake/${token}/respond/${offerId}`, data),
}
