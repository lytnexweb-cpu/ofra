import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import TransactionCard, { TransactionCardSkeleton } from '../TransactionCard'
import CountdownBadge from '../CountdownBadge'
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
    dueDate: '2025-02-01T00:00:00Z',
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
      ownerUserId: 1,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@example.com',
      phone: null,
      notes: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      provinceState: null,
      postalCode: null,
      homePhone: null,
      workPhone: null,
      cellPhone: null,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    property: { address: '123 Rue Main, Moncton' },
    ...overrides,
  }
}

// --- TransactionCard Tests ---

describe('TransactionCard', () => {
  it('displays step name, client name, and property address', () => {
    const tx = makeTx()
    renderWithProviders(<TransactionCard transaction={tx} />)

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText('123 Rue Main, Moncton')).toBeInTheDocument()
    // Step name is translated via i18n key
    expect(screen.getByText('Conditional Period')).toBeInTheDocument()
  })

  it('displays blocking badge when blocking conditions > 0', () => {
    const tx = makeTx({
      conditions: [
        makeCondition({ id: 1, isBlocking: true, status: 'pending' }),
        makeCondition({ id: 2, isBlocking: true, status: 'pending' }),
      ],
    })
    renderWithProviders(<TransactionCard transaction={tx} />)

    const badge = screen.getByTestId('blocking-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('2')
  })

  it('does not display blocking badge when no blocking conditions', () => {
    const tx = makeTx({ conditions: [] })
    renderWithProviders(<TransactionCard transaction={tx} />)

    expect(screen.queryByTestId('blocking-badge')).not.toBeInTheDocument()
  })

  it('does not display blocking badge for completed blocking conditions', () => {
    const tx = makeTx({
      conditions: [
        makeCondition({ id: 1, isBlocking: true, status: 'completed' }),
      ],
    })
    renderWithProviders(<TransactionCard transaction={tx} />)

    expect(screen.queryByTestId('blocking-badge')).not.toBeInTheDocument()
  })

  it('displays transaction type badge', () => {
    const tx = makeTx({ type: 'purchase' })
    renderWithProviders(<TransactionCard transaction={tx} />)

    expect(screen.getByText('Purchase')).toBeInTheDocument()
  })

  it('has red accent bar when blocking conditions exist', () => {
    const tx = makeTx({
      conditions: [makeCondition({ id: 1, isBlocking: true, status: 'pending' })],
    })
    const { container } = renderWithProviders(<TransactionCard transaction={tx} />)

    // The new design uses a top accent bar instead of left border
    const accentBar = container.querySelector('[class*="bg-destructive"]')
    expect(accentBar).toBeInTheDocument()
  })

  it('has primary accent bar when no blocking conditions', () => {
    const tx = makeTx({ conditions: [] })
    const { container } = renderWithProviders(<TransactionCard transaction={tx} />)

    // The new design uses a top accent bar with primary color when no blocking
    const accentBar = container.querySelector('.bg-primary')
    expect(accentBar).toBeInTheDocument()
  })

  it('has correct data-testid', () => {
    const tx = makeTx({ id: 42 })
    renderWithProviders(<TransactionCard transaction={tx} />)

    expect(screen.getByTestId('transaction-card-42')).toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const tx = makeTx({
      conditions: [makeCondition({ id: 1, isBlocking: true, status: 'pending', dueDate: '2025-02-01T00:00:00Z' })],
    })
    const { container } = renderWithProviders(<TransactionCard transaction={tx} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// --- TransactionCardSkeleton Tests ---

describe('TransactionCardSkeleton', () => {
  it('renders skeleton structure', () => {
    renderWithProviders(<TransactionCardSkeleton />)

    expect(screen.getByTestId('transaction-card-skeleton')).toBeInTheDocument()
  })
})

// --- CountdownBadge Tests ---

describe('CountdownBadge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 27, 12, 0, 0)) // Jan 27, 2026
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays "Today!" for deadline = today', () => {
    renderWithProviders(<CountdownBadge dueDate="2026-01-27T12:00:00.000Z" />)

    expect(screen.getByTestId('countdown-badge')).toHaveTextContent('Today!')
  })

  it('displays "Tomorrow" for deadline = tomorrow', () => {
    renderWithProviders(<CountdownBadge dueDate="2026-01-28T12:00:00.000Z" />)

    expect(screen.getByTestId('countdown-badge')).toHaveTextContent('Tomorrow')
  })

  it('displays "in X days" for deadline 2-7 days away', () => {
    renderWithProviders(<CountdownBadge dueDate="2026-01-30T12:00:00.000Z" />)

    expect(screen.getByTestId('countdown-badge')).toHaveTextContent('in 3 days')
  })

  it('displays overdue text for past deadlines', () => {
    renderWithProviders(<CountdownBadge dueDate="2026-01-25T12:00:00.000Z" />)

    expect(screen.getByTestId('countdown-badge')).toHaveTextContent('2 days ago')
  })

  it('returns null when deadline is more than 7 days away', () => {
    const { container } = renderWithProviders(<CountdownBadge dueDate="2026-02-10T12:00:00.000Z" />)

    expect(container.innerHTML).toBe('')
  })

  it('returns null when completedAt is set', () => {
    const { container } = renderWithProviders(
      <CountdownBadge dueDate="2026-01-30T12:00:00.000Z" completedAt="2026-01-26T12:00:00.000Z" />
    )

    expect(container.innerHTML).toBe('')
  })

  it('has clock icon (AR16: never color alone)', () => {
    renderWithProviders(<CountdownBadge dueDate="2026-01-30T12:00:00.000Z" />)

    const badge = screen.getByTestId('countdown-badge')
    const svg = badge.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
