import { http } from './http'

export type FintracIdType =
  | 'drivers_license'
  | 'canadian_passport'
  | 'foreign_passport'
  | 'citizenship_card'
  | 'other_government_id'

export interface FintracRecord {
  id: number
  transactionId: number
  partyId: number
  dateOfBirth: string | null
  idType: FintracIdType | null
  idNumber: string | null
  occupation: string | null
  sourceOfFunds: string | null
  verifiedAt: string | null
  verifiedByUserId: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
  party?: {
    id: number
    fullName: string
    role: string
    email: string | null
    phone: string | null
  }
  verifiedBy?: {
    id: number
    fullName: string
  }
}

export interface CompleteFintracData {
  dateOfBirth: string
  idType: FintracIdType
  idNumber: string
  occupation?: string
  sourceOfFunds?: string
  notes?: string
}

export const fintracApi = {
  list: (transactionId: number) =>
    http.get<{ records: FintracRecord[]; isCompliant: boolean }>(`/api/transactions/${transactionId}/fintrac`),

  get: (id: number) =>
    http.get<{ record: FintracRecord }>(`/api/fintrac/${id}`),

  complete: (id: number, data: CompleteFintracData) =>
    http.patch<{ record: FintracRecord }>(`/api/fintrac/${id}/complete`, data),

  resolve: (id: number) =>
    http.post<{ message: string }>(`/api/fintrac/${id}/resolve`),
}
