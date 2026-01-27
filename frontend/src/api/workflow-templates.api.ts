import { http } from './http'

export type TransactionType = 'purchase' | 'sale'

export interface WorkflowStepConditionTemplate {
  id: number
  stepId: number
  title: string
  description: string | null
  conditionType: string
  priority: 'low' | 'medium' | 'high'
  isBlockingDefault: boolean
  isRequired: boolean
  dueDateOffsetDays: number | null
  sortOrder: number
}

export interface WorkflowStepAutomationTemplate {
  id: number
  stepId: number
  trigger: 'on_enter' | 'on_exit' | 'on_condition_complete'
  actionType: string
  delayDays: number
  templateRef: string | null
  config: Record<string, any>
}

export interface WorkflowStepTemplate {
  id: number
  templateId: number
  stepOrder: number
  name: string
  slug: string
  description: string | null
  typicalDurationDays: number | null
  conditions?: WorkflowStepConditionTemplate[]
  automations?: WorkflowStepAutomationTemplate[]
}

export interface WorkflowTemplate {
  id: number
  provinceCode: string
  name: string
  slug: string
  description: string | null
  transactionType: TransactionType
  isDefault: boolean
  isActive: boolean
  createdByUserId: number | null
  organizationId: number | null
  createdAt: string
  updatedAt: string
  steps?: WorkflowStepTemplate[]
}

export interface CreateWorkflowTemplateRequest {
  provinceCode: string
  name: string
  slug: string
  description?: string
  transactionType: TransactionType
  isDefault?: boolean
  isActive?: boolean
  steps?: {
    stepOrder: number
    name: string
    slug: string
    description?: string
    typicalDurationDays?: number
    conditions?: {
      title: string
      description?: string
      conditionType: string
      priority?: 'low' | 'medium' | 'high'
      isBlockingDefault?: boolean
      isRequired?: boolean
      dueDateOffsetDays?: number
      sortOrder?: number
    }[]
    automations?: {
      trigger: 'on_enter' | 'on_exit' | 'on_condition_complete'
      actionType: string
      delayDays?: number
      templateRef?: string
      config?: Record<string, any>
    }[]
  }[]
}

export const workflowTemplatesApi = {
  list: (params?: { province?: string; type?: string; active?: string }) => {
    const query = new URLSearchParams()
    if (params?.province) query.append('province', params.province)
    if (params?.type) query.append('type', params.type)
    if (params?.active) query.append('active', params.active)
    const queryString = query.toString()
    return http.get<{ templates: WorkflowTemplate[] }>(
      `/api/workflow-templates${queryString ? `?${queryString}` : ''}`
    )
  },

  get: (id: number) =>
    http.get<{ template: WorkflowTemplate }>(`/api/workflow-templates/${id}`),

  create: (data: CreateWorkflowTemplateRequest) =>
    http.post<{ template: WorkflowTemplate }>('/api/workflow-templates', data),

  update: (id: number, data: Partial<Pick<WorkflowTemplate, 'name' | 'description' | 'isDefault' | 'isActive'>>) =>
    http.put<{ template: WorkflowTemplate }>(`/api/workflow-templates/${id}`, data),

  delete: (id: number) =>
    http.delete<{}>(`/api/workflow-templates/${id}`),
}
