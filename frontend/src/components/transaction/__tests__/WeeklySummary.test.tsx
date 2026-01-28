import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import WeeklySummary from '../WeeklySummary'
import type { Transaction, TransactionStep } from '../../../api/transactions.api'
import type { Condition } from '../../../api/conditions.api'

// --- Factories ---

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
    documentUrl: null,
    documentLabel: null,
    dueDate: '2026-02-01T12:00:00.000Z',
    completedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
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
    client: {
      id: 1,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@example.com',
      phone: null,
      preferredLanguage: 'fr',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    property: { address: '123 Rue Main, Moncton' },
    ...overrides,
  } as Transaction
}

// --- Tests ---

describe('WeeklySummary', () => {
  beforeEach(() => {
    // Jan 27, 2026 at noon
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 0, 27, 12, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays overdue count with AlertTriangle icon (AC1)', () => {
    const tx = makeTx({
      conditions: [
        makeCondition({ id: 1, dueDate: '2026-01-25T12:00:00.000Z', isBlocking: true, status: 'pending' }),
        makeCondition({ id: 2, dueDate: '2026-01-24T12:00:00.000Z', isBlocking: true, status: 'pending' }),
      ],
    })

    renderWithProviders(<WeeklySummary transactions={[tx]} />)

    expect(screen.getByText('2 overdue')).toBeInTheDocument()
    // AlertTriangle SVG should be present
    const summary = screen.getByTestId('weekly-summary')
    expect(summary.querySelector('svg')).toBeInTheDocument()
  })

  it('displays this-week count with Clock icon (AC1)', () => {
    const tx = makeTx({
      conditions: [
        makeCondition({ id: 1, dueDate: '2026-01-29T12:00:00.000Z', isBlocking: true, status: 'pending' }),
        makeCondition({ id: 2, dueDate: '2026-01-30T12:00:00.000Z', isBlocking: true, status: 'pending' }),
        makeCondition({ id: 3, dueDate: '2026-02-01T12:00:00.000Z', isBlocking: true, status: 'pending' }),
      ],
    })

    renderWithProviders(<WeeklySummary transactions={[tx]} />)

    expect(screen.getByText('3 this week')).toBeInTheDocument()
  })

  it('displays dot separator when both overdue and this-week present', () => {
    const tx = makeTx({
      conditions: [
        makeCondition({ id: 1, dueDate: '2026-01-25T12:00:00.000Z', isBlocking: true, status: 'pending' }),
        makeCondition({ id: 2, dueDate: '2026-01-29T12:00:00.000Z', isBlocking: true, status: 'pending' }),
      ],
    })

    renderWithProviders(<WeeklySummary transactions={[tx]} />)

    expect(screen.getByText('1 overdue')).toBeInTheDocument()
    expect(screen.getByText('1 this week')).toBeInTheDocument()
    // Dot separator
    expect(screen.getByText('·')).toBeInTheDocument()
  })

  it('displays "All clear" when no urgency (AC2)', () => {
    const tx = makeTx({ conditions: [] })

    renderWithProviders(<WeeklySummary transactions={[tx]} />)

    expect(screen.getByText('All clear this week')).toBeInTheDocument()
  })

  it('ignores non-blocking and completed conditions', () => {
    const tx = makeTx({
      conditions: [
        // Non-blocking — should be ignored
        makeCondition({ id: 1, dueDate: '2026-01-25T12:00:00.000Z', isBlocking: false, status: 'pending' }),
        // Completed — should be ignored
        makeCondition({ id: 2, dueDate: '2026-01-25T12:00:00.000Z', isBlocking: true, status: 'completed' }),
        // No due date — should be ignored
        makeCondition({ id: 3, dueDate: null as any, isBlocking: true, status: 'pending' }),
      ],
    })

    renderWithProviders(<WeeklySummary transactions={[tx]} />)

    // All conditions ignored → "All clear"
    expect(screen.getByText('All clear this week')).toBeInTheDocument()
  })

  it('has data-testid="weekly-summary"', () => {
    renderWithProviders(<WeeklySummary transactions={[]} />)

    expect(screen.getByTestId('weekly-summary')).toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const tx = makeTx({
      conditions: [
        makeCondition({ id: 1, dueDate: '2026-01-25T12:00:00.000Z', isBlocking: true, status: 'pending' }),
        makeCondition({ id: 2, dueDate: '2026-01-29T12:00:00.000Z', isBlocking: true, status: 'pending' }),
      ],
    })

    const { container } = renderWithProviders(<WeeklySummary transactions={[tx]} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
