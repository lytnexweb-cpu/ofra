import { http } from './http'
import type { ConditionType, ConditionPriority, ConditionStage } from './conditions.api'
import type { TransactionType } from './transactions.api'

export interface TemplateCondition {
  id: number
  templateId: number
  title: string
  description: string | null
  type: ConditionType
  priority: ConditionPriority
  stage: ConditionStage
  isBlocking: boolean
  dueDateOffsetDays: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface TransactionTemplate {
  id: number
  name: string
  slug: string
  description: string | null
  transactionType: TransactionType
  isDefault: boolean
  isActive: boolean
  ownerUserId: number | null
  conditions: TemplateCondition[]
  createdAt: string
  updatedAt: string
}

export const templatesApi = {
  list: (params?: { type?: TransactionType }) => {
    const query = new URLSearchParams()
    if (params?.type) query.append('type', params.type)
    const queryString = query.toString()
    return http.get<{ templates: TransactionTemplate[] }>(
      `/api/templates${queryString ? `?${queryString}` : ''}`
    )
  },

  get: (id: number) =>
    http.get<{ template: TransactionTemplate }>(`/api/templates/${id}`),
}
