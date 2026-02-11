import { http } from './http'

// Legacy types
export type ConditionStatus = 'pending' | 'in_progress' | 'completed'
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

// Premium types (D4/D27)
export type ConditionLevel = 'blocking' | 'required' | 'recommended'
export type SourceType = 'legal' | 'government' | 'industry' | 'best_practice'
export type ResolutionType = 'completed' | 'waived' | 'not_applicable' | 'skipped_with_risk'

export interface Condition {
  id: number
  transactionId: number
  transactionStepId: number | null
  templateId: number | null
  title: string
  description: string | null
  status: ConditionStatus
  type: ConditionType
  priority: ConditionPriority
  isBlocking: boolean
  documentUrl: string | null
  documentLabel: string | null
  dueDate: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
  // Premium fields
  labelFr?: string | null
  labelEn?: string | null
  level?: ConditionLevel
  sourceType?: SourceType | null
  resolutionType?: ResolutionType | null
  resolutionNote?: string | null
  resolvedAt?: string | null
  resolvedBy?: string | null
  archived?: boolean
  archivedAt?: string | null
  archivedStep?: number | null
  stepWhenCreated?: number | null
  stepWhenResolved?: number | null
  // D41: Escape tracking
  escapedWithoutProof?: boolean
  escapeReason?: string | null
  escapeConfirmedAt?: string | null
  // Preloaded template (for pack badge)
  template?: {
    id: number
    pack: string | null
  } | null
}

export interface ConditionEvidence {
  id: number
  conditionId: number
  type: 'file' | 'link' | 'note'
  fileUrl?: string | null
  url?: string | null
  note?: string | null
  title?: string | null
  createdBy: number
  createdAt: string
}

export interface ConditionEvent {
  id: number
  conditionId: number
  eventType: string
  actorId: string
  meta: Record<string, any>
  createdAt: string
}

export interface CreateConditionRequest {
  transactionId: number
  title: string
  description?: string
  dueDate: string
  type?: ConditionType
  priority?: ConditionPriority
  transactionStepId?: number
  isBlocking?: boolean
  level?: ConditionLevel
  documentUrl?: string
  documentLabel?: string
  templateId?: number // Link to template (prevents duplicate suggestions)
}

export interface UpdateConditionRequest {
  title?: string
  description?: string
  dueDate?: string
  status?: ConditionStatus
  type?: ConditionType
  priority?: ConditionPriority
  transactionStepId?: number
  isBlocking?: boolean
  documentUrl?: string
  documentLabel?: string
}

export interface ResolveConditionRequest {
  resolutionType: ResolutionType
  note?: string
  // D41: Evidence tracking
  hasEvidence?: boolean
  evidenceId?: number | null
  evidenceFilename?: string | null
  // D41: Escape without proof (for blocking conditions)
  escapedWithoutProof?: boolean
  escapeReason?: string
}

export interface ConditionResolutionInput {
  conditionId: number
  resolutionType: ResolutionType
  note?: string
}

export interface AdvanceCheckResult {
  canAdvance: boolean
  currentStep: {
    order: number
    name: string
  } | null
  blockingConditions: Pick<Condition, 'id' | 'title' | 'labelFr' | 'labelEn'>[]
  requiredPendingConditions: Pick<Condition, 'id' | 'title' | 'labelFr' | 'labelEn'>[]
  recommendedPendingConditions: Pick<Condition, 'id' | 'title' | 'labelFr' | 'labelEn'>[]
}

export interface TimelineData {
  [step: number]: {
    id: number
    title: string
    labelFr?: string | null
    labelEn?: string | null
    level?: ConditionLevel
    status: ConditionStatus
    resolutionType?: ResolutionType | null
    resolutionNote?: string | null
    resolvedAt?: string | null
    resolvedBy?: string | null
    archived?: boolean
    archivedStep?: number | null
  }[]
}

export interface ConditionTemplate {
  id: number
  labelFr: string
  labelEn: string
  descriptionFr: string | null
  descriptionEn: string | null
  level: ConditionLevel
  sourceType: SourceType | null
  step: number | null
  pack: string | null
  category: string | null
  defaultDeadlineDays: number | null
  deadlineReference: string | null
}

export interface ApplicableTemplatesData {
  templates: ConditionTemplate[]
  profile: {
    propertyType: string
    propertyContext: string
    isFinanced: boolean
  }
}

export const conditionsApi = {
  // Legacy endpoints
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

  // Premium endpoints (D4/D27)
  resolve: (id: number, data: ResolveConditionRequest) =>
    http.post<{ condition: Condition }>(`/api/conditions/${id}/resolve`, data),

  getHistory: (id: number) =>
    http.get<{ condition: Partial<Condition>; events: ConditionEvent[] }>(
      `/api/conditions/${id}/history`
    ),

  getEvidence: (id: number) =>
    http.get<{ evidence: ConditionEvidence[] }>(`/api/conditions/${id}/evidence`),

  addEvidence: (id: number, data: { type: 'file' | 'link' | 'note'; fileUrl?: string; url?: string; note?: string; title?: string }) =>
    http.post<{ evidence: ConditionEvidence }>(`/api/conditions/${id}/evidence`, data),

  uploadEvidence: async (id: number, file: File, title?: string): Promise<{ success: boolean; data?: { evidence: ConditionEvidence }; error?: { message: string } }> => {
    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)

    const API_URL = import.meta.env.VITE_API_URL || ''
    const response = await fetch(`${API_URL}/api/conditions/${id}/evidence`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      // No Content-Type header — browser sets multipart boundary automatically
    })
    return response.json()
  },

  removeEvidence: (conditionId: number, evidenceId: number) =>
    http.delete<{}>(`/api/conditions/${conditionId}/evidence/${evidenceId}`),

  // Transaction-level Premium endpoints
  getTimeline: (transactionId: number) =>
    http.get<{ timeline: TimelineData }>(`/api/transactions/${transactionId}/conditions/timeline`),

  getActive: (transactionId: number) =>
    http.get<{
      conditions: Condition[]
      summary: {
        total: number
        blocking: number
        required: number
        recommended: number
        pending: number
        completed: number
      }
    }>(`/api/transactions/${transactionId}/conditions/active`),

  advanceCheck: (transactionId: number) =>
    http.get<AdvanceCheckResult>(`/api/transactions/${transactionId}/conditions/advance-check`),

  // D44: Applicable templates for suggestions panel
  getApplicableTemplates: (transactionId: number, step?: number) =>
    http.get<ApplicableTemplatesData>(
      `/api/transactions/${transactionId}/applicable-templates${step ? `?step=${step}` : ''}`
    ),
}
