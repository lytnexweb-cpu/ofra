import TransactionStep from '#models/transaction_step'
import type { TransactionStepStatus } from '#models/transaction_step'
import { DateTime } from 'luxon'

export async function createTransactionStep(
  transactionId: number,
  workflowStepId: number,
  overrides: Partial<{
    stepOrder: number
    status: TransactionStepStatus
    enteredAt: string
    completedAt: string
  }> = {}
): Promise<TransactionStep> {
  return TransactionStep.create({
    transactionId,
    workflowStepId,
    stepOrder: overrides.stepOrder ?? 1,
    status: overrides.status ?? 'pending',
    enteredAt: overrides.enteredAt ? DateTime.fromISO(overrides.enteredAt) : null,
    completedAt: overrides.completedAt ? DateTime.fromISO(overrides.completedAt) : null,
  })
}
