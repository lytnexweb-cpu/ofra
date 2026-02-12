import { http } from './http'

export type MemberRole = 'viewer' | 'editor' | 'admin'
export type MemberStatus = 'active' | 'pending' | 'revoked'

export interface TransactionMember {
  id: number
  transactionId: number
  userId: number | null
  email: string
  role: MemberRole
  status: MemberStatus
  invitedByUserId: number
  acceptedAt: string | null
  revokedAt: string | null
  createdAt: string
  updatedAt: string
  user?: { id: number; fullName: string | null; email: string }
}

export interface InviteMemberRequest {
  email: string
  role: MemberRole
  message?: string
}

export interface OwnerEntry {
  id: 'owner'
  role: 'owner'
  status: 'active'
  fullName: string | null
  email: string
  userId: number
}

export const membersApi = {
  list: (transactionId: number) =>
    http.get<{ owner: OwnerEntry; members: TransactionMember[] }>(`/api/transactions/${transactionId}/members`),

  invite: (transactionId: number, data: InviteMemberRequest) =>
    http.post<{ member: TransactionMember }>(`/api/transactions/${transactionId}/members`, data),

  updateRole: (transactionId: number, memberId: number, role: MemberRole) =>
    http.patch<{ member: TransactionMember }>(
      `/api/transactions/${transactionId}/members/${memberId}`,
      { role }
    ),

  revoke: (transactionId: number, memberId: number) =>
    http.delete<{}>(`/api/transactions/${transactionId}/members/${memberId}`),
}
