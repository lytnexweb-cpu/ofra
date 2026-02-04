import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import ConditionsTab from '../ConditionsTab'
import type { Transaction, TransactionStep } from '../../../api/transactions.api'
import type { Condition } from '../../../api/conditions.api'

const mockUpdate = vi.fn()

vi.mock('../../../api/conditions.api', async () => {
  const actual = await vi.importActual('../../../api/conditions.api')
  return {
    ...(actual as object),
    conditionsApi: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  }
})

vi.mock('../../../hooks/use-toast', () => ({
  toast: vi.fn(),
}))

// --- Factories ---

function makeStep(overrides: Partial<TransactionStep> = {}): TransactionStep {
  return {
    id: 10,
    transactionId: 1,
    workflowStepId: 1,
    stepOrder: 1,
    status: 'active',
    enteredAt: '2025-01-01T00:00:00Z',
    completedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    workflowStep: {
      id: 1,
      name: 'Consultation',
      slug: 'consultation',
      stepOrder: 1,
      typicalDurationDays: null,
    },
    ...overrides,
  }
}

function makeCondition(overrides: Partial<Condition> = {}): Condition {
  return {
    id: 100,
    transactionId: 1,
    transactionStepId: 10,
    title: 'Financing Approval',
    description: 'Client needs financing',
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
    transactionSteps: [makeStep()],
    conditions: [],
    ...overrides,
  }
}

beforeEach(() => {
  mockUpdate.mockReset().mockResolvedValue({ success: true })
})

// --- Tests ---

describe('ConditionsTab', () => {
  it('shows empty state when no conditions exist', () => {
    renderWithProviders(<ConditionsTab transaction={makeTx()} />)
    expect(screen.getByTestId('conditions-empty')).toBeInTheDocument()
  })

  it('renders conditions grouped by step', () => {
    const step2 = makeStep({
      id: 20,
      workflowStepId: 2,
      stepOrder: 2,
      status: 'pending',
      workflowStep: {
        id: 2,
        name: 'Offer Submitted',
        slug: 'offer-submitted',
        stepOrder: 2,
        typicalDurationDays: 3,
      },
    })
    const tx = makeTx({
      transactionSteps: [makeStep(), step2],
      conditions: [
        makeCondition({ id: 1, transactionStepId: 10, title: 'Financing' }),
        makeCondition({ id: 2, transactionStepId: 20, title: 'Deposit' }),
      ],
    })
    renderWithProviders(<ConditionsTab transaction={tx} />)

    expect(screen.getByTestId('conditions-tab')).toBeInTheDocument()
    expect(screen.getAllByText('Financing').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Deposit').length).toBeGreaterThanOrEqual(1)
    // Two step groups rendered
    expect(screen.getByTestId('step-group-1')).toBeInTheDocument()
    expect(screen.getByTestId('step-group-2')).toBeInTheDocument()
  })

  it('labels the current step with "(current)"', () => {
    const tx = makeTx({
      conditions: [makeCondition({ id: 1, transactionStepId: 10 })],
    })
    renderWithProviders(<ConditionsTab transaction={tx} />)
    expect(screen.getByText('(current)')).toBeInTheDocument()
  })

  it('sorts blocking conditions before non-blocking within a step', () => {
    const tx = makeTx({
      conditions: [
        makeCondition({
          id: 1,
          transactionStepId: 10,
          title: 'Non-blocking',
          isBlocking: false,
          dueDate: '2025-01-15T00:00:00Z',
        }),
        makeCondition({
          id: 2,
          transactionStepId: 10,
          title: 'Blocking',
          isBlocking: true,
          dueDate: '2025-01-20T00:00:00Z',
        }),
      ],
    })
    renderWithProviders(<ConditionsTab transaction={tx} />)

    const cards = screen.getAllByTestId(/^condition-card-/)
    expect(cards[0]).toHaveAttribute('data-testid', 'condition-card-2')
    expect(cards[1]).toHaveAttribute('data-testid', 'condition-card-1')
  })

  it('toggles past steps visibility on click', () => {
    const tx = makeTx({
      currentStepId: 20,
      transactionSteps: [
        makeStep({ id: 10, stepOrder: 1, status: 'completed', completedAt: '2025-01-05T00:00:00Z' }),
        makeStep({
          id: 20,
          workflowStepId: 2,
          stepOrder: 2,
          status: 'active',
          workflowStep: {
            id: 2,
            name: 'Offer Submitted',
            slug: 'offer-submitted',
            stepOrder: 2,
            typicalDurationDays: 3,
          },
        }),
      ],
      conditions: [
        makeCondition({ id: 1, transactionStepId: 10, title: 'Past Condition' }),
        makeCondition({ id: 2, transactionStepId: 20, title: 'Current Condition' }),
      ],
    })
    renderWithProviders(<ConditionsTab transaction={tx} />)

    // Current condition visible
    expect(screen.getByText('Current Condition')).toBeInTheDocument()
    // Past condition hidden
    expect(screen.queryByText('Past Condition')).not.toBeInTheDocument()

    // Toggle reveals past conditions
    fireEvent.click(screen.getByTestId('toggle-past-steps'))
    expect(screen.getByText('Past Condition')).toBeInTheDocument()
  })

  it('calls conditionsApi.update when toggling a condition', async () => {
    // D41: Use 'recommended' level to test direct toggle (blocking/required open validation modal)
    const tx = makeTx({
      conditions: [makeCondition({
        id: 42,
        transactionStepId: 10,
        status: 'pending',
        isBlocking: false,
        level: 'recommended',
      })],
    })
    renderWithProviders(<ConditionsTab transaction={tx} />)

    fireEvent.click(screen.getByTestId('toggle-condition-42'))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(42, { status: 'completed' })
    })
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const tx = makeTx({
      conditions: [makeCondition({ id: 1, transactionStepId: 10 })],
    })
    const { container } = renderWithProviders(<ConditionsTab transaction={tx} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
