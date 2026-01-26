import { http } from './http'
import type { Client } from './clients.api'

export type TransactionStatus =
  | 'active'
  | 'offer'
  | 'conditional'
  | 'firm'
  | 'closing'
  | 'completed'
  | 'cancelled'

export type TransactionType = 'purchase' | 'sale'

export interface OfferRevision {
  id: number
  offerId: number
  revisionNumber: number
  price: number
  deposit: number | null
  financingAmount: number | null
  expiryAt: string | null
  notes: string | null
  direction: 'buyer_to_seller' | 'seller_to_buyer'
  createdByUserId: number | null
  createdAt: string
}

export type OfferStatus = 'received' | 'countered' | 'accepted' | 'rejected' | 'expired' | 'withdrawn'

export interface Offer {
  id: number
  transactionId: number
  status: OfferStatus
  acceptedAt: string | null
  createdAt: string
  updatedAt: string
  revisions?: OfferRevision[]
}

export interface Transaction {
  id: number
  ownerUserId: number
  clientId: number
  propertyId: number | null
  type: TransactionType
  status: TransactionStatus
  salePrice: number | null
  notesText: string | null
  listPrice: number | null
  commission: number | null
  folderUrl: string | null
  createdAt: string
  updatedAt: string
  client?: Client
  property?: any
  conditions?: any[]
  offers?: Offer[]
  notes?: any[]
}

export interface CreateTransactionRequest {
  clientId: number
  propertyId?: number
  type: TransactionType
  status?: TransactionStatus
  salePrice?: number
  notesText?: string
  listPrice?: number
  commission?: number
  folderUrl?: string
  templateId?: number
}

export interface UpdateTransactionRequest {
  clientId?: number
  propertyId?: number
  type?: TransactionType
  status?: TransactionStatus
  salePrice?: number
  notesText?: string
  listPrice?: number
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
