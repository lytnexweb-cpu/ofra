import { http } from './http'
import type { Client } from './clients.api'

export type TransactionType = 'purchase' | 'sale'
export type TransactionStatus = 'active' | 'cancelled'
export type TransactionStepStatus = 'pending' | 'active' | 'completed' | 'skipped'

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

export interface WorkflowStepInfo {
  id: number
  name: string
  slug: string
  stepOrder: number
  typicalDurationDays: number | null
}

export interface TransactionStep {
  id: number
  transactionId: number
  workflowStepId: number
  stepOrder: number
  status: TransactionStepStatus
  enteredAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  workflowStep?: WorkflowStepInfo
  conditions?: any[]
}

export interface Transaction {
  id: number
  ownerUserId: number
  clientId: number
  propertyId: number | null
  type: TransactionType
  status: TransactionStatus
  workflowTemplateId: number | null
  currentStepId: number | null
  organizationId: number | null
  salePrice: number | null
  notesText: string | null
  listPrice: number | null
  commission: number | null
  folderUrl: string | null
  cancelledAt: string | null
  cancellationReason: string | null
  createdAt: string
  updatedAt: string
  client?: Client
  property?: any
  currentStep?: TransactionStep
  transactionSteps?: TransactionStep[]
  conditions?: any[]
  offers?: Offer[]
  notes?: any[]
}

export interface CreateTransactionRequest {
  clientId: number
  propertyId?: number
  type: TransactionType
  workflowTemplateId: number
  salePrice?: number
  notesText?: string
  listPrice?: number
  commission?: number
  folderUrl?: string
  address?: string
}

export interface UpdateTransactionRequest {
  clientId?: number
  propertyId?: number
  type?: TransactionType
  salePrice?: number
  notesText?: string
  listPrice?: number
  commission?: number
  folderUrl?: string
}

export interface ActivityEntry {
  id: number
  transactionId: number
  userId: number | null
  activityType: string
  metadata: Record<string, any>
  createdAt: string
  user?: { id: number; fullName: string | null; email: string }
}

// Transaction Profile types (D1: Conditions Engine Premium)
export type PropertyType = 'house' | 'condo' | 'land'
export type PropertyContext = 'urban' | 'suburban' | 'rural'
export type AccessType = 'public' | 'private' | 'right_of_way'

export interface TransactionProfile {
  transactionId: number
  propertyType: PropertyType
  propertyContext: PropertyContext
  isFinanced: boolean
  hasWell?: boolean | null
  hasSeptic?: boolean | null
  accessType?: AccessType | null
  condoDocsRequired?: boolean | null
  appraisalRequired?: boolean | null
}

export interface CreateProfileRequest {
  propertyType: PropertyType
  propertyContext: PropertyContext
  isFinanced: boolean
  hasWell?: boolean
  hasSeptic?: boolean
  accessType?: AccessType
  condoDocsRequired?: boolean
  appraisalRequired?: boolean
}

export const transactionsApi = {
  list: (params?: { step?: string; q?: string }) => {
    const query = new URLSearchParams()
    if (params?.step) query.append('step', params.step)
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

  delete: (id: number) => http.delete<{}>(`/api/transactions/${id}`),

  cancel: (id: number, reason?: string) =>
    http.patch<{ transaction: Transaction }>(`/api/transactions/${id}/cancel`, { reason }),

  advanceStep: (id: number) =>
    http.patch<{ transaction: Transaction; newStep: TransactionStep | null }>(
      `/api/transactions/${id}/advance`,
      {}
    ),

  skipStep: (id: number) =>
    http.patch<{ transaction: Transaction; newStep: TransactionStep | null }>(
      `/api/transactions/${id}/skip`,
      {}
    ),

  goToStep: (id: number, stepOrder: number) =>
    http.patch<{ transaction: Transaction; newStep: TransactionStep }>(
      `/api/transactions/${id}/goto/${stepOrder}`,
      {}
    ),

  getActivity: (id: number, page = 1, limit = 20) =>
    http.get<{ data: ActivityEntry[]; meta: { total: number; perPage: number; currentPage: number } }>(
      `/api/transactions/${id}/activity?page=${page}&limit=${limit}`
    ),

  // Transaction Profile (D1: Conditions Engine Premium)
  getProfile: (id: number) =>
    http.get<{ profile: TransactionProfile }>(`/api/transactions/${id}/profile`),

  upsertProfile: (id: number, data: CreateProfileRequest) =>
    http.put<{ profile: TransactionProfile; created: boolean }>(`/api/transactions/${id}/profile`, data),

  getProfileStatus: (id: number) =>
    http.get<{ exists: boolean; complete: boolean; missingFields?: string[] }>(
      `/api/transactions/${id}/profile/status`
    ),

  // D39: Load condition pack
  loadConditionPack: (id: number, dates?: { acceptanceDate?: string; closingDate?: string }) =>
    http.post<{ loaded: number; byStep: Record<number, number>; message: string }>(
      `/api/transactions/${id}/profile/load-pack`,
      dates ?? {}
    ),
}
