import { http } from './http'

export interface TransactionShareLink {
  id: number
  transactionId: number
  token: string
  isActive: boolean
  expiresAt: string | null
  password: string | null
  accessCount: number
  createdByUserId: number
  createdAt: string
  updatedAt: string
}

export interface CreateShareLinkRequest {
  expiresAt?: string | null
  password?: string | null
}

export interface UpdateShareLinkRequest {
  isActive?: boolean
  expiresAt?: string | null
  password?: string | null
}

export const shareLinksApi = {
  get: (transactionId: number) =>
    http.get<{ shareLink: TransactionShareLink | null }>(`/api/transactions/${transactionId}/share-link`),

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
