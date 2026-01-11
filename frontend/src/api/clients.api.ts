import { http } from './http'
import type { Transaction, TransactionStatus } from './transactions.api'
import type { Condition } from './conditions.api'

export interface TransactionStatusHistory {
  id: number
  transactionId: number
  changedByUserId: number
  fromStatus: TransactionStatus | null
  toStatus: TransactionStatus
  note: string | null
  createdAt: string
}

export interface TransactionWithTimeline extends Transaction {
  statusHistories: TransactionStatusHistory[]
  conditions: Condition[]
}

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
}
