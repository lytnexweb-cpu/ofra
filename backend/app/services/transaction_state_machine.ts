import { TransactionStatus } from '#models/transaction'

/**
 * Defines valid status transitions for transactions
 *
 * Flow: active → offer → conditional → firm → closing → completed
 * Any status can transition to 'cancelled'
 * Some backward transitions are allowed
 *
 * Business rule: transition to 'conditional' or 'firm' requires an accepted offer
 * (enforced in controller, not here)
 */
const VALID_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  active: ['offer', 'cancelled'],
  offer: ['conditional', 'active', 'cancelled'], // conditional when offer accepted
  conditional: ['firm', 'offer', 'cancelled'], // firm when all conditions met
  firm: ['closing', 'conditional', 'cancelled'], // closing when notary done
  closing: ['completed', 'firm', 'cancelled'],
  completed: [], // Terminal state
  cancelled: ['active'], // Can reopen
}

/**
 * Human-readable status labels
 */
export const STATUS_LABELS: Record<TransactionStatus, string> = {
  active: 'Active',
  offer: 'Offer',
  conditional: 'Conditional',
  firm: 'Firm',
  closing: 'Closing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/**
 * Check if a status transition is valid
 */
export function isValidTransition(
  fromStatus: TransactionStatus,
  toStatus: TransactionStatus
): boolean {
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
    active: 0,
    offer: 20,
    conditional: 40,
    firm: 60,
    closing: 80,
    completed: 100,
    cancelled: 0,
  }
  return progressMap[status]
}
