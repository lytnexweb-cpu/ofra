import { DateTime } from 'luxon'
import Condition from '#models/condition'

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
export type ConditionLevel = 'blocking' | 'required' | 'recommended'

let conditionCounter = 0

export async function createCondition(
  transactionId: number,
  overrides: Partial<{
    title: string
    description: string
    status: ConditionStatus
    type: ConditionType
    priority: ConditionPriority
    level: ConditionLevel
    transactionStepId: number
    isBlocking: boolean
    dueDate: string
    completedAt: string
    documentUrl: string
    documentLabel: string
  }> = {}
): Promise<Condition> {
  conditionCounter++
  const isBlocking = overrides.isBlocking ?? true
  const level = overrides.level ?? (isBlocking ? 'blocking' : 'recommended')

  return Condition.create({
    transactionId,
    title: overrides.title ?? `Test Condition ${conditionCounter}`,
    description: overrides.description ?? null,
    status: overrides.status ?? 'pending',
    type: overrides.type ?? 'other',
    priority: overrides.priority ?? 'medium',
    level,
    transactionStepId: overrides.transactionStepId ?? null,
    isBlocking,
    dueDate: overrides.dueDate ? DateTime.fromISO(overrides.dueDate) : null,
    completedAt: overrides.completedAt ? DateTime.fromISO(overrides.completedAt) : null,
    documentUrl: overrides.documentUrl ?? null,
    documentLabel: overrides.documentLabel ?? null,
  })
}
