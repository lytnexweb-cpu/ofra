import { TransactionStatus } from '#models/transaction'

/**
 * Defines valid status transitions for transactions
 *
 * Flow: consultation → offer → accepted → conditions → notary → closing → completed
 * Any status can transition to 'canceled'
 * Some backward transitions are allowed (e.g., rejected offer goes back to consultation)
 */
const VALID_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  consultation: ['offer', 'canceled'],
  offer: ['accepted', 'consultation', 'canceled'], // Can go back if offer rejected
  accepted: ['conditions', 'offer', 'canceled'], // Can go back if issues found
  conditions: ['notary', 'accepted', 'canceled'], // Can go back if conditions fail
  notary: ['closing', 'conditions', 'canceled'], // Can go back if notary issues
  closing: ['completed', 'notary', 'canceled'], // Can go back if closing delayed
  completed: [], // Terminal state - no transitions allowed
  canceled: ['consultation'], // Can reopen a canceled transaction
}

/**
 * Human-readable status labels
 */
export const STATUS_LABELS: Record<TransactionStatus, string> = {
  consultation: 'Consultation',
  offer: 'Offer Made',
  accepted: 'Offer Accepted',
  conditions: 'Conditions Period',
  notary: 'At Notary',
  closing: 'Closing',
  completed: 'Completed',
  canceled: 'Canceled',
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(
  fromStatus: TransactionStatus,
  toStatus: TransactionStatus
): boolean {
  // Same status is always valid (no change)
  if (fromStatus === toStatus) {
    return true
  }

  const allowedTransitions = VALID_TRANSITIONS[fromStatus]
  return allowedTransitions.includes(toStatus)
}

/**
 * Get allowed next statuses from current status
 */
export function getAllowedTransitions(currentStatus: TransactionStatus): TransactionStatus[] {
  return VALID_TRANSITIONS[currentStatus]
}

/**
 * Get validation error message for invalid transition
 */
export function getTransitionError(
  fromStatus: TransactionStatus,
  toStatus: TransactionStatus
): string {
  const allowedStatuses = VALID_TRANSITIONS[fromStatus].map((s) => STATUS_LABELS[s]).join(', ')

  return `Cannot change status from "${STATUS_LABELS[fromStatus]}" to "${STATUS_LABELS[toStatus]}". Allowed transitions: ${allowedStatuses || 'none (terminal state)'}`
}

/**
 * Check if a status is a terminal state (no further transitions)
 */
export function isTerminalStatus(status: TransactionStatus): boolean {
  return VALID_TRANSITIONS[status].length === 0
}

/**
 * Get the progress percentage for a status (for UI progress bars)
 */
export function getStatusProgress(status: TransactionStatus): number {
  const progressMap: Record<TransactionStatus, number> = {
    consultation: 0,
    offer: 15,
    accepted: 30,
    conditions: 50,
    notary: 70,
    closing: 85,
    completed: 100,
    canceled: 0,
  }
  return progressMap[status]
}
