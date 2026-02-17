import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../test/helpers'
import DashboardPage from '../DashboardPage'
import type { DashboardUrgenciesData, UrgencyItem } from '../../api/dashboard.api'

const mockGetUrgencies = vi.fn()
const mockMe = vi.fn()

vi.mock('../../api/dashboard.api', async () => {
  const actual = await vi.importActual('../../api/dashboard.api')
  return {
    ...(actual as object),
    dashboardApi: {
      getUrgencies: (...args: unknown[]) => mockGetUrgencies(...args),
    },
  }
})

vi.mock('../../api/auth.api', async () => {
  const actual = await vi.importActual('../../api/auth.api')
  return {
    ...(actual as object),
    authApi: {
      ...(actual as any).authApi,
      me: (...args: unknown[]) => mockMe(...args),
    },
  }
})

vi.mock('../../components/ui', async () => {
  const actual = await vi.importActual('../../components/ui')
  return {
    ...(actual as object),
    PageTransition: ({ children }: any) => <div>{children}</div>,
    DashboardSkeleton: () => <div data-testid="dashboard-skeleton">Loading...</div>,
  }
})

vi.mock('../../components/dashboard', () => ({
  DashboardUrgencies: ({ state, urgencyCount, totalActiveTransactions }: any) => (
    <div data-testid="dashboard-urgencies" data-state={state}>
      <span data-testid="urgency-count">{urgencyCount}</span>
      <span data-testid="active-tx">{totalActiveTransactions}</span>
    </div>
  ),
}))

function makeUrgenciesData(overrides: Partial<DashboardUrgenciesData> = {}): DashboardUrgenciesData {
  return {
    state: 'urgencies',
    urgencies: [
      {
        conditionId: 1,
        conditionTitle: 'Financing',
        daysRemaining: -2,
        dueDate: '2026-02-01',
        transactionId: 1,
        clientName: 'Jean Dupont',
        stepName: 'Conditional Period',
        level: 'blocking',
        isBlocking: true,
      } as UrgencyItem,
    ],
    hasMore: false,
    moreCount: 0,
    totalActiveTransactions: 12,
    totalTransactions: 25,
    urgencyCount: 3,
    greenCount: 5,
    nextDeadlineDays: 2,
    ...overrides,
  }
}

beforeEach(() => {
  mockGetUrgencies.mockReset()
  mockMe.mockReset().mockResolvedValue({
    success: true,
    data: { user: { fullName: 'André Dupont' } },
  })
})

describe('DashboardPage', () => {
  it('shows skeleton while loading (AC1)', () => {
    mockGetUrgencies.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<DashboardPage />)

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument()
  })

  it('shows error state on API failure (AC2)', async () => {
    mockGetUrgencies.mockRejectedValue(new Error('Network error'))
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/failed to load|error|erreur/i)).toBeInTheDocument()
    })
  })

  it('renders DashboardUrgencies on success (AC3)', async () => {
    mockGetUrgencies.mockResolvedValue({ success: true, data: makeUrgenciesData() })
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-urgencies')).toBeInTheDocument()
    })
  })

  it('passes urgency count to component (AC4)', async () => {
    mockGetUrgencies.mockResolvedValue({ success: true, data: makeUrgenciesData({ urgencyCount: 7 }) })
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('urgency-count')).toHaveTextContent('7')
    })
  })

  it('passes active transactions count (AC5)', async () => {
    mockGetUrgencies.mockResolvedValue({
      success: true,
      data: makeUrgenciesData({ totalActiveTransactions: 15 }),
    })
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('active-tx')).toHaveTextContent('15')
    })
  })

  it('renders with empty state (AC6)', async () => {
    mockGetUrgencies.mockResolvedValue({
      success: true,
      data: makeUrgenciesData({ state: 'empty', urgencies: [], urgencyCount: 0, totalActiveTransactions: 0 }),
    })
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      const urgencies = screen.getByTestId('dashboard-urgencies')
      expect(urgencies).toHaveAttribute('data-state', 'empty')
    })
  })

  it('renders with all_clear state (AC7)', async () => {
    mockGetUrgencies.mockResolvedValue({
      success: true,
      data: makeUrgenciesData({ state: 'all_clear', urgencies: [] }),
    })
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      const urgencies = screen.getByTestId('dashboard-urgencies')
      expect(urgencies).toHaveAttribute('data-state', 'all_clear')
    })
  })

  it('handles nullish data gracefully (AC8)', async () => {
    mockGetUrgencies.mockResolvedValue({ success: true, data: null })
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      // Should show error state, not crash
      expect(screen.getByText(/failed to load|error|erreur/i)).toBeInTheDocument()
    })
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    mockGetUrgencies.mockResolvedValue({ success: true, data: makeUrgenciesData() })
    const { container } = renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-urgencies')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
