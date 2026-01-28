import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../test/helpers'
import TransactionsPage from '../TransactionsPage'
import { transactionsApi } from '../../api/transactions.api'
import type { Transaction, TransactionStep } from '../../api/transactions.api'
import type { Condition } from '../../api/conditions.api'

// Mock CreateTransactionModal (complex deps: useQuery for clients/templates)
vi.mock('../../components/CreateTransactionModal', () => ({
  default: () => null,
}))

// Mock transactions API — keep types, replace list()
vi.mock('../../api/transactions.api', async () => {
  const actual = await vi.importActual<typeof import('../../api/transactions.api')>(
    '../../api/transactions.api'
  )
  return {
    ...actual,
    transactionsApi: {
      ...actual.transactionsApi,
      list: vi.fn(),
    },
  }
})

const mockList = vi.mocked(transactionsApi.list)

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

function mockApiData(transactions: Transaction[]) {
  mockList.mockResolvedValue({
    success: true,
    data: { transactions },
  } as any)
}

// --- Tests ---

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 0, 27, 12, 0, 0))
    mockList.mockReset()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('displays TransactionCards sorted by urgency (overdue first)', async () => {
    const txCalm = makeTx({
      id: 1,
      conditions: [],
      client: {
        id: 1, firstName: 'Claire', lastName: 'Calm',
        email: 'c@ex.com', phone: null, preferredLanguage: 'fr',
        createdAt: '', updatedAt: '',
      } as any,
    })
    const txUrgent = makeTx({
      id: 2,
      conditions: [
        makeCondition({ id: 1, dueDate: '2026-01-25T12:00:00.000Z', isBlocking: true, status: 'pending' }),
      ],
      client: {
        id: 2, firstName: 'Alice', lastName: 'Urgent',
        email: 'a@ex.com', phone: null, preferredLanguage: 'fr',
        createdAt: '', updatedAt: '',
      } as any,
    })

    // Provide in wrong urgency order (calm first)
    mockApiData([txCalm, txUrgent])

    renderWithProviders(<TransactionsPage />)
    await waitFor(() => {
      expect(screen.getByText('Alice Urgent')).toBeInTheDocument()
    })

    const cards = screen.getAllByTestId(/^transaction-card-/)
    expect(cards[0]).toHaveAttribute('data-testid', 'transaction-card-2') // Urgent first
    expect(cards[1]).toHaveAttribute('data-testid', 'transaction-card-1') // Calm second
  })

  it('displays 3 skeleton cards during loading', () => {
    mockList.mockReturnValue(new Promise(() => {}) as any) // Never resolves

    renderWithProviders(<TransactionsPage />)

    expect(screen.getByTestId('transactions-skeleton')).toBeInTheDocument()
    const skeletons = screen.getAllByTestId('transaction-card-skeleton')
    expect(skeletons).toHaveLength(3)
  })

  it('displays error state with retry button on API error', async () => {
    mockList.mockRejectedValue(new Error('Network error'))

    renderWithProviders(<TransactionsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('transactions-error')).toBeInTheDocument()
    })
    expect(screen.getByTestId('retry-btn')).toBeInTheDocument()
  })

  it('displays EmptyState when 0 transactions', async () => {
    mockApiData([])

    renderWithProviders(<TransactionsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
  })

  it('grid has responsive classes grid-cols-1 lg:grid-cols-2', async () => {
    mockApiData([makeTx()])

    renderWithProviders(<TransactionsPage />)

    await waitFor(() => {
      const grid = screen.getByTestId('transactions-grid')
      expect(grid.className).toContain('grid-cols-1')
      expect(grid.className).toContain('lg:grid-cols-2')
    })
  })

  it('renders FAB create button', async () => {
    mockApiData([makeTx()])

    renderWithProviders(<TransactionsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('fab-create')).toBeInTheDocument()
    })
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    mockApiData([makeTx()])

    const { container } = renderWithProviders(<TransactionsPage />)

    await waitFor(() => {
      expect(screen.getByTestId('transactions-grid')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  // --- Search & Filter Tests (Story 2a-3) ---

  describe('SearchBar + Step Filter', () => {
    const txAndre = makeTx({
      id: 10,
      client: {
        id: 10, firstName: 'André', lastName: 'Côté',
        email: 'andre@ex.com', phone: null, preferredLanguage: 'fr',
        createdAt: '', updatedAt: '',
      } as any,
      property: { address: '123 Rue Érable, Dieppe' },
      currentStep: makeStep({
        id: 20, workflowStepId: 4, stepOrder: 4, status: 'active',
        workflowStep: { id: 4, name: 'Conditional Period', slug: 'conditional-period', stepOrder: 4, typicalDurationDays: 14 },
      }),
      currentStepId: 20,
    })

    const txJean = makeTx({
      id: 11,
      client: {
        id: 11, firstName: 'Jean', lastName: 'Dupont',
        email: 'jean@ex.com', phone: null, preferredLanguage: 'fr',
        createdAt: '', updatedAt: '',
      } as any,
      property: { address: '456 Rue Oak, Moncton' },
      currentStep: makeStep({
        id: 21, workflowStepId: 3, stepOrder: 3, status: 'active',
        workflowStep: { id: 3, name: 'Offer Accepted', slug: 'offer-accepted', stepOrder: 3, typicalDurationDays: 7 },
      }),
      currentStepId: 21,
    })

    const txMarie = makeTx({
      id: 12,
      client: {
        id: 12, firstName: 'Marie', lastName: 'Tremblay',
        email: 'marie@ex.com', phone: null, preferredLanguage: 'fr',
        createdAt: '', updatedAt: '',
      } as any,
      property: { address: '789 Boul. Acadie, Moncton' },
      currentStep: makeStep({
        id: 22, workflowStepId: 4, stepOrder: 4, status: 'active',
        workflowStep: { id: 4, name: 'Conditional Period', slug: 'conditional-period', stepOrder: 4, typicalDurationDays: 14 },
      }),
      currentStepId: 22,
    })

    it('filters transactions by client name search (AC1)', async () => {
      mockApiData([txAndre, txJean, txMarie])

      renderWithProviders(<TransactionsPage />)
      await waitFor(() => {
        expect(screen.getByText('André Côté')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'dupont' } })

      await waitFor(() => {
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
        expect(screen.queryByText('André Côté')).not.toBeInTheDocument()
        expect(screen.queryByText('Marie Tremblay')).not.toBeInTheDocument()
      })
    })

    it('normalizeSearch handles accents — "andre cote" finds "André Côté" (AC1, AR4)', async () => {
      mockApiData([txAndre, txJean, txMarie])

      renderWithProviders(<TransactionsPage />)
      await waitFor(() => {
        expect(screen.getByText('André Côté')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'andre cote' } })

      await waitFor(() => {
        expect(screen.getByText('André Côté')).toBeInTheDocument()
        expect(screen.queryByText('Jean Dupont')).not.toBeInTheDocument()
        expect(screen.queryByText('Marie Tremblay')).not.toBeInTheDocument()
      })
    })

    it('step filter shows only transactions of selected step (AC3)', async () => {
      mockApiData([txAndre, txJean, txMarie])

      renderWithProviders(<TransactionsPage />)
      await waitFor(() => {
        expect(screen.getByText('André Côté')).toBeInTheDocument()
      })

      // Filter by "conditional-period" — should show André and Marie, hide Jean
      fireEvent.change(screen.getByTestId('step-filter'), { target: { value: 'conditional-period' } })

      await waitFor(() => {
        expect(screen.getByText('André Côté')).toBeInTheDocument()
        expect(screen.getByText('Marie Tremblay')).toBeInTheDocument()
        expect(screen.queryByText('Jean Dupont')).not.toBeInTheDocument()
      })
    })

    it('combined search + step filter (AC4)', async () => {
      mockApiData([txAndre, txJean, txMarie])

      renderWithProviders(<TransactionsPage />)
      await waitFor(() => {
        expect(screen.getByText('André Côté')).toBeInTheDocument()
      })

      // Filter step = conditional-period AND search = "andre"
      fireEvent.change(screen.getByTestId('step-filter'), { target: { value: 'conditional-period' } })
      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'andre' } })

      await waitFor(() => {
        expect(screen.getByText('André Côté')).toBeInTheDocument()
        expect(screen.queryByText('Jean Dupont')).not.toBeInTheDocument()
        expect(screen.queryByText('Marie Tremblay')).not.toBeInTheDocument()
      })
    })

    it('shows "no results" message when filters match nothing (AC5)', async () => {
      mockApiData([txAndre, txJean, txMarie])

      renderWithProviders(<TransactionsPage />)
      await waitFor(() => {
        expect(screen.getByText('André Côté')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'zzzznotfound' } })

      await waitFor(() => {
        expect(screen.getByTestId('filter-empty')).toBeInTheDocument()
      })
    })

    it('"Clear filters" button resets search and step filter', async () => {
      mockApiData([txAndre, txJean, txMarie])

      renderWithProviders(<TransactionsPage />)
      await waitFor(() => {
        expect(screen.getByText('André Côté')).toBeInTheDocument()
      })

      // Apply filters that match nothing
      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'zzzznotfound' } })
      await waitFor(() => {
        expect(screen.getByTestId('filter-empty')).toBeInTheDocument()
      })

      // Click "Clear filters"
      fireEvent.click(screen.getByTestId('clear-filters-btn'))

      await waitFor(() => {
        expect(screen.getByText('André Côté')).toBeInTheDocument()
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
        expect(screen.getByText('Marie Tremblay')).toBeInTheDocument()
      })
    })

    it('X button clears search field', async () => {
      mockApiData([txAndre, txJean, txMarie])

      renderWithProviders(<TransactionsPage />)
      await waitFor(() => {
        expect(screen.getByText('André Côté')).toBeInTheDocument()
      })

      // Type search to filter
      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'dupont' } })
      await waitFor(() => {
        expect(screen.queryByText('André Côté')).not.toBeInTheDocument()
      })

      // Click X (clear) button — aria-label is "Close"
      fireEvent.click(screen.getByLabelText('Close'))

      await waitFor(() => {
        expect(screen.getByText('André Côté')).toBeInTheDocument()
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
        expect(screen.getByText('Marie Tremblay')).toBeInTheDocument()
      })
    })
  })
})
