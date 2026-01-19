import Condition from '#models/condition'
import type { TransactionStatus } from './transaction.js'

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

let conditionCounter = 0

export async function createCondition(
  transactionId: number,
  overrides: Partial<{
    title: string
    description: string
    status: ConditionStatus
    type: ConditionType
    priority: ConditionPriority
    stage: TransactionStatus
    isBlocking: boolean
  }> = {}
): Promise<Condition> {
  conditionCounter++
  return Condition.create({
    transactionId,
    title: overrides.title ?? `Test Condition ${conditionCounter}`,
    description: overrides.description ?? null,
    status: overrides.status ?? 'pending',
    type: overrides.type ?? 'other',           // OBLIGATOIRE
    priority: overrides.priority ?? 'medium',  // OBLIGATOIRE
    stage: overrides.stage ?? 'conditions',    // OBLIGATOIRE
    isBlocking: overrides.isBlocking ?? true,
  })
}
