import { http } from './http'
import type { Client } from './clients.api'

export type TransactionStatus =
  | 'consultation'
  | 'offer'
  | 'accepted'
  | 'conditions'
  | 'notary'
  | 'closing'
  | 'completed'
  | 'canceled'

export type TransactionType = 'purchase' | 'sale'

export interface Transaction {
  id: number
  ownerUserId: number
  clientId: number
  propertyId: number | null
  type: TransactionType
  status: TransactionStatus
  salePrice: number | null
  notesText: string | null
  // Offer Details fields
  listPrice: number | null
  offerPrice: number | null
  counterOfferEnabled: boolean
  counterOfferPrice: number | null
  offerExpiryAt: string | null
  commission: number | null
  folderUrl: string | null
  createdAt: string
  updatedAt: string
  client?: Client
  property?: any
  conditions?: any[]
  notes?: any[]
}

export interface CreateTransactionRequest {
  clientId: number
  propertyId?: number
  type: TransactionType
  status?: TransactionStatus
  salePrice?: number
  notesText?: string
  // Offer Details fields
  listPrice?: number
  offerPrice?: number
  counterOfferEnabled?: boolean
  counterOfferPrice?: number
  offerExpiryAt?: string
  commission?: number
  folderUrl?: string
}

export interface UpdateTransactionRequest {
  clientId?: number
  propertyId?: number
  type?: TransactionType
  status?: TransactionStatus
  salePrice?: number
  notesText?: string
  // Offer Details fields
  listPrice?: number
  offerPrice?: number
  counterOfferEnabled?: boolean
  counterOfferPrice?: number
  offerExpiryAt?: string
  commission?: number
  folderUrl?: string
}

export const transactionsApi = {
  list: (params?: { status?: string; q?: string }) => {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.q) query.append('q', params.q)
    const queryString = query.toString()
    return http.get<{ transactions: Transaction[] }>(
      `/api/transactions${queryString ? `?${queryString}` : ''}`
    )
  },

  create: (data: CreateTransactionRequest) =>
    http.post<{ transaction: Transaction }>('/api/transactions', data),

  get: (id: number) =>
    http.get<{ transaction: Transaction }>(`/api/transactions/${id}`),

  update: (id: number, data: UpdateTransactionRequest) =>
    http.put<{ transaction: Transaction }>(`/api/transactions/${id}`, data),

  updateStatus: (id: number, status: TransactionStatus, note?: string) =>
    http.patch<{ transaction: Transaction }>(`/api/transactions/${id}/status`, {
      status,
      note,
    }),

  delete: (id: number) => http.delete<{}>(`/api/transactions/${id}`),
}
