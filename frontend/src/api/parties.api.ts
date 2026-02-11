import { http } from './http'

export type PartyRole = 'buyer' | 'seller' | 'lawyer' | 'notary' | 'agent' | 'broker' | 'other'

export interface TransactionParty {
  id: number
  transactionId: number
  role: PartyRole
  fullName: string
  email: string | null
  phone: string | null
  address: string | null
  company: string | null
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePartyRequest {
  role: PartyRole
  fullName: string
  email?: string | null
  phone?: string | null
  address?: string | null
  company?: string | null
  isPrimary?: boolean
}

export interface UpdatePartyRequest {
  role?: PartyRole
  fullName?: string
  email?: string | null
  phone?: string | null
  address?: string | null
  company?: string | null
  isPrimary?: boolean
}

export const partiesApi = {
  list: (transactionId: number) =>
    http.get<{ parties: TransactionParty[] }>(`/api/transactions/${transactionId}/parties`),

  create: (transactionId: number, data: CreatePartyRequest) =>
    http.post<{ party: TransactionParty }>(`/api/transactions/${transactionId}/parties`, data),

  update: (partyId: number, data: UpdatePartyRequest) =>
    http.put<{ party: TransactionParty }>(`/api/parties/${partyId}`, data),

  delete: (partyId: number) =>
    http.delete<{}>(`/api/parties/${partyId}`),
}
