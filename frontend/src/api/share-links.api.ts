import { http } from './http'

export type ShareLinkType = 'viewer' | 'offer_intake'

export interface TransactionShareLink {
  id: number
  transactionId: number
  token: string
  linkType: ShareLinkType
  role: 'viewer' | 'editor'
  isActive: boolean
  expiresAt: string | null
  hasPassword: boolean
  accessCount: number
  lastAccessedAt: string | null
  createdAt: string
}

export interface CreateShareLinkRequest {
  linkType?: ShareLinkType
  expiresAt?: string | null
  password?: string | null
}

export interface UpdateShareLinkRequest {
  isActive?: boolean
  expiresAt?: string | null
  password?: string | null
}

export const shareLinksApi = {
  get: (transactionId: number, linkType?: ShareLinkType) =>
    http.get<{ shareLink: TransactionShareLink | null }>(
      `/api/transactions/${transactionId}/share-link${linkType ? `?linkType=${linkType}` : ''}`
    ),

  create: (transactionId: number, data: CreateShareLinkRequest) =>
    http.post<{ shareLink: TransactionShareLink }>(`/api/transactions/${transactionId}/share-link`, data),

  update: (transactionId: number, linkId: number, data: UpdateShareLinkRequest) =>
    http.patch<{ shareLink: TransactionShareLink }>(
      `/api/transactions/${transactionId}/share-link/${linkId}`,
      data
    ),

  disable: (transactionId: number, linkId: number) =>
    http.delete<{}>(`/api/transactions/${transactionId}/share-link/${linkId}`),
}
