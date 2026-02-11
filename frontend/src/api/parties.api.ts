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

export const partiesApi = {
  list: (transactionId: number) =>
    http.get<{ parties: TransactionParty[] }>(`/api/transactions/${transactionId}/parties`),
}
