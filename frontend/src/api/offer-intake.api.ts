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
}

export const offerIntakeApi = {
  getInfo: (token: string): Promise<ApiResponse<OfferIntakeInfo>> =>
    http.get(`/api/offer-intake/${token}`),

  submit: (token: string, data: OfferIntakeSubmission): Promise<ApiResponse<{ message: string }>> =>
    http.post(`/api/offer-intake/${token}`, data),
}
