import { http } from './http'

export type ConditionStatus = 'pending' | 'completed'
export type ConditionType =
  | 'financing'
  | 'deposit'
  | 'inspection'
  | 'water_test'
  | 'rpds_review'
  | 'appraisal'
  | 'legal'
  | 'documents'
  | 'repairs'
  | 'other'
export type ConditionPriority = 'low' | 'medium' | 'high'
export type TransactionStatus =
  | 'consultation'
  | 'offer'
  | 'accepted'
  | 'conditions'
  | 'notary'
  | 'closing'
  | 'completed'
  | 'canceled'
export type ConditionStage = TransactionStatus

export interface Condition {
  id: number
  transactionId: number
  title: string
  description: string | null
  status: ConditionStatus
  type: ConditionType
  priority: ConditionPriority
  stage: ConditionStage
  dueDate: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateConditionRequest {
  transactionId: number
  title: string
  description?: string
  dueDate: string
  type?: ConditionType
  priority?: ConditionPriority
  stage?: ConditionStage
}

export interface UpdateConditionRequest {
  title?: string
  description?: string
  dueDate?: string
  status?: ConditionStatus
  type?: ConditionType
  priority?: ConditionPriority
  stage?: ConditionStage
}

export const conditionsApi = {
  create: (data: CreateConditionRequest) =>
    http.post<{ condition: Condition }>(
      `/api/transactions/${data.transactionId}/conditions`,
      data
    ),

  update: (id: number, data: UpdateConditionRequest) =>
    http.put<{ condition: Condition }>(`/api/conditions/${id}`, data),

  complete: (id: number) =>
    http.patch<{ condition: Condition }>(`/api/conditions/${id}/complete`, {}),

  delete: (id: number) => http.delete<{}>(`/api/conditions/${id}`),
}
