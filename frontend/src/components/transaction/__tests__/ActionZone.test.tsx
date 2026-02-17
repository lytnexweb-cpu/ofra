import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import ActionZone from '../ActionZone'
import type { Transaction, TransactionStep } from '../../../api/transactions.api'
import type { Condition } from '../../../api/conditions.api'

const mockAdvanceCheck = vi.fn()
const mockSkipStep = vi.fn()

vi.mock('../../../api/conditions.api', async () => {
  const actual = await vi.importActual('../../../api/conditions.api')
  return {
    ...(actual as object),
    conditionsApi: {
      ...(actual as any).conditionsApi,
      advanceCheck: (...args: unknown[]) => mockAdvanceCheck(...args),
    },
  }
})

vi.mock('../../../api/transactions.api', async () => {
  const actual = await vi.importActual('../../../api/transactions.api')
  return {
    ...(actual as object),
    transactionsApi: {
      ...(actual as any).transactionsApi,
      skipStep: (...args: unknown[]) => mockSkipStep(...args),
    },
  }
})

vi.mock('../../../hooks/use-toast', () => ({
  toast: vi.fn(),
}))

// Mock ValidateStepModal to keep tests focused on ActionZone
vi.mock('../ValidateStepModal', () => ({
  default: ({ isOpen }: any) => isOpen ? <div data-testid="validate-step-modal">Modal</div> : null,
}))

function makeStep(overrides: Partial<TransactionStep> = {}): TransactionStep {
  return {
    id: 10,
    transactionId: 1,
    workflowStepId: 4,
    stepOrder: 4,
    status: 'active',
    enteredAt: '2025-01-10T00:00:00Z',
    completedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    workflowStep: {
      id: 4,
      name: 'Conditional Period',
      slug: 'conditional-period',
      stepOrder: 4,
      typicalDurationDays: 14,
    },
    ...overrides,
  }
}

function makeCondition(overrides: Partial<Condition> = {}): Condition {
  return {
    id: 100,
    transactionId: 1,
    transactionStepId: 10,
    title: 'Financing',
    description: null,
    status: 'pending',
    type: 'financing',
    priority: 'high',
    isBlocking: true,
    level: 'blocking',
    documentUrl: null,
    documentLabel: null,
    dueDate: '2025-02-01T00:00:00Z',
    completedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  } as Condition
}

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  const step = makeStep()
  return {
    id: 1,
    ownerUserId: 1,
    clientId: 1,
    propertyId: null,
    type: 'purchase',
    workflowTemplateId: 1,
    currentStepId: 10,
    organizationId: null,
    salePrice: null,
    notesText: null,
    listPrice: null,
    commission: null,
    folderUrl: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    currentStep: step,
    transactionSteps: [step],
    conditions: [],
    ...overrides,
  }
}

beforeEach(() => {
  mockAdvanceCheck.mockReset().mockResolvedValue({
    success: true,
    data: { canAdvance: true, blockingConditions: [], requiredPendingConditions: [], recommendedPendingConditions: [] },
  })
  mockSkipStep.mockReset().mockResolvedValue({ success: true })
})

describe('ActionZone', () => {
  it('renders nothing when the transaction is completed', () => {
    const tx = makeTx({ currentStepId: null, currentStep: undefined })
    const { container } = renderWithProviders(<ActionZone transaction={tx} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders action-zone for active transaction', () => {
    const tx = makeTx()
    renderWithProviders(<ActionZone transaction={tx} />)
    expect(screen.getByTestId('action-zone')).toBeInTheDocument()
  })

  it('shows advance-step button', () => {
    const tx = makeTx({ conditions: [] })
    renderWithProviders(<ActionZone transaction={tx} />)
    expect(screen.getByTestId('advance-step-btn')).toBeInTheDocument()
  })

  it('shows blocking count when blocking conditions exist', () => {
    const tx = makeTx({
      conditions: [
        makeCondition({ id: 1, level: 'blocking', status: 'pending' }),
        makeCondition({ id: 2, level: 'blocking', status: 'pending' }),
      ],
    })
    renderWithProviders(<ActionZone transaction={tx} />)

    const zone = screen.getByTestId('action-zone')
    expect(zone.textContent).toMatch(/2/)
  })

  it('advance button opens ValidateStepModal when no blockers', async () => {
    const tx = makeTx({ conditions: [] })
    renderWithProviders(<ActionZone transaction={tx} />)

    fireEvent.click(screen.getByTestId('advance-step-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('validate-step-modal')).toBeInTheDocument()
    })
  })

  it('advance button is disabled when blocking conditions exist', () => {
    const tx = makeTx({
      conditions: [makeCondition({ id: 1, level: 'blocking', status: 'pending' })],
    })
    renderWithProviders(<ActionZone transaction={tx} />)

    expect(screen.getByTestId('advance-step-btn')).toBeDisabled()
  })

  it('has no WCAG 2.1 AA accessibility violations (no blockers)', async () => {
    const tx = makeTx({ conditions: [] })
    const { container } = renderWithProviders(<ActionZone transaction={tx} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no WCAG 2.1 AA accessibility violations (with blockers)', async () => {
    const tx = makeTx({
      conditions: [makeCondition({ id: 1, level: 'blocking', status: 'pending' })],
    })
    const { container } = renderWithProviders(<ActionZone transaction={tx} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
