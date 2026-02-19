import { http } from './http'
import type { Transaction, TransactionStep } from './transactions.api'
import type { Condition } from './conditions.api'

export interface TransactionWithTimeline extends Transaction {
  transactionSteps: TransactionStep[]
  conditions: Condition[]
}

export type ClientType = 'buyer' | 'seller' | 'both'

export interface Client {
  id: number
  ownerUserId: number
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  notes: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  provinceState: string | null
  postalCode: string | null
  homePhone: string | null
  workPhone: string | null
  cellPhone: string | null
  clientType: ClientType | null
  createdAt: string
  updatedAt: string
}

export interface CreateClientRequest {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  notes?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  provinceState?: string
  postalCode?: string
  homePhone?: string
  workPhone?: string
  cellPhone?: string
  clientType?: ClientType
}

export interface UpdateClientRequest {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  notes?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  provinceState?: string
  postalCode?: string
  homePhone?: string
  workPhone?: string
  cellPhone?: string
  clientType?: ClientType
}

export interface CsvImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{
    row: number
    message: string
    data?: Record<string, string>
  }>
}

export const clientsApi = {
  list: () => http.get<{ clients: Client[] }>('/api/clients'),

  create: (data: CreateClientRequest) =>
    http.post<{ client: Client }>('/api/clients', data),

  get: (id: number) => http.get<{ client: Client }>(`/api/clients/${id}`),

  getTransactions: (id: number) =>
    http.get<{ transactions: TransactionWithTimeline[] }>(
      `/api/clients/${id}/transactions`
    ),

  update: (id: number, data: UpdateClientRequest) =>
    http.put<{ client: Client }>(`/api/clients/${id}`, data),

  delete: (id: number) => http.delete<{}>(`/api/clients/${id}`),

  // CSV Import - uses direct fetch for FormData support
  importCsv: async (file: File): Promise<{ success: boolean; data: CsvImportResult }> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/clients/import', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      // Note: Don't set Content-Type header - browser sets it with boundary for FormData
    })

    const result = await response.json()
    return result
  },

  getImportTemplate: () => '/api/clients/import/template',
}
