import { http } from './http'

export type DocumentCategory = 'offer' | 'inspection' | 'financing' | 'identity' | 'legal' | 'other'
export type DocumentStatus = 'missing' | 'uploaded' | 'validated' | 'rejected'

export interface TransactionDocument {
  id: number
  transactionId: number
  name: string
  category: DocumentCategory
  status: DocumentStatus
  fileUrl: string | null
  conditionId: number | null
  rejectionReason: string | null
  validatedAt: string | null
  validatedByUserId: number | null
  createdAt: string
  updatedAt: string
}

export interface CreateDocumentRequest {
  name: string
  category: DocumentCategory
  fileUrl?: string
  conditionId?: number | null
}

export interface UpdateDocumentRequest {
  name?: string
  category?: DocumentCategory
  fileUrl?: string
}

export const documentsApi = {
  list: (transactionId: number) =>
    http.get<{ documents: TransactionDocument[] }>(`/api/transactions/${transactionId}/documents`),

  get: (id: number) =>
    http.get<{ document: TransactionDocument }>(`/api/documents/${id}`),

  create: (transactionId: number, data: CreateDocumentRequest) =>
    http.post<{ document: TransactionDocument }>(`/api/transactions/${transactionId}/documents`, data),

  update: (id: number, data: UpdateDocumentRequest) =>
    http.put<{ document: TransactionDocument }>(`/api/documents/${id}`, data),

  validate: (id: number) =>
    http.patch<{ document: TransactionDocument }>(`/api/documents/${id}/validate`, {}),

  reject: (id: number, reason: string) =>
    http.patch<{ document: TransactionDocument }>(`/api/documents/${id}/reject`, { reason }),

  delete: (id: number) =>
    http.delete<{}>(`/api/documents/${id}`),
}
