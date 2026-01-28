import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../test/helpers'
import DashboardPage from '../DashboardPage'
import type { DashboardSummary } from '../../api/dashboard.api'

const mockGetSummary = vi.fn()

vi.mock('../../components/dashboard', () => ({
  KPICard: ({ title, value, suffix }: any) => (
    <div data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      {value}{suffix}
    </div>
  ),
  PipelineChart: ({ data }: any) => (
    <div data-testid="pipeline-chart">{data?.length ?? 0} steps</div>
  ),
  RevenueChart: ({ totalRevenue }: any) => (
    <div data-testid="revenue-chart">${totalRevenue}</div>
  ),
  RecentActivity: ({ activities }: any) => (
    <div data-testid="recent-activity">{activities?.length ?? 0} activities</div>
  ),
  UpcomingDeadlines: ({ deadlines }: any) => (
    <div data-testid="upcoming-deadlines">{deadlines?.length ?? 0} deadlines</div>
  ),
}))

vi.mock('../../components/ui', async () => {
  const actual = await vi.importActual('../../components/ui')
  return {
    ...(actual as object),
    PageTransition: ({ children }: any) => <div>{children}</div>,
    DashboardSkeleton: () => <div data-testid="dashboard-skeleton">Loading...</div>,
  }
})

vi.mock('../../api/dashboard.api', async () => {
  const actual = await vi.importActual('../../api/dashboard.api')
  return {
    ...(actual as object),
    dashboardApi: {
      getSummary: (...args: unknown[]) => mockGetSummary(...args),
    },
  }
})

function makeSummary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    totalTransactions: 25,
    activeTransactions: 12,
    completedTransactions: 10,
    overdueConditions: 3,
    dueSoonConditions: 5,
    conversionRate: 40,
    pipeline: [
      { slug: 'consultation', name: 'Consultation', count: 4 },
      { slug: 'inspection', name: 'Inspection', count: 3 },
    ],
    revenue: [
      { month: 'Jan', total: 15000 },
      { month: 'Feb', total: 22000 },
    ],
    totalRevenue: 37000,
    monthRevenue: 22000,
    recentActivity: [
      { id: 1, transactionId: 1, activityType: 'step_entered', metadata: {}, clientName: 'Jean Dupont', userName: 'André', createdAt: '2026-01-27T12:00:00Z' },
    ],
    upcomingDeadlines: [
      { id: 1, title: 'Financing', dueDate: '2026-02-01', transactionId: 1, clientName: 'Jean Dupont', priority: 'high' as const, isBlocking: false },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  mockGetSummary.mockReset()
})

describe('DashboardPage', () => {
  it('shows skeleton while loading (AC1)', () => {
    mockGetSummary.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<DashboardPage />)

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument()
  })

  it('shows error state on API failure (AC2)', async () => {
    mockGetSummary.mockRejectedValue(new Error('Network error'))
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument()
    })
  })

  it('renders Dashboard header on success (AC3)', async () => {
    mockGetSummary.mockResolvedValue({ success: true, data: makeSummary() } as any)
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
    expect(screen.getByText(/Welcome back/)).toBeInTheDocument()
  })

  it('renders 4 KPI cards (AC4)', async () => {
    mockGetSummary.mockResolvedValue({ success: true, data: makeSummary() } as any)
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('kpi-active-transactions')).toBeInTheDocument()
    })
    expect(screen.getByTestId('kpi-completed')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-conversion-rate')).toBeInTheDocument()
    expect(screen.getByTestId('kpi-overdue-conditions')).toBeInTheDocument()
  })

  it('renders PipelineChart and RevenueChart (AC5)', async () => {
    mockGetSummary.mockResolvedValue({ success: true, data: makeSummary() } as any)
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('pipeline-chart')).toBeInTheDocument()
    })
    expect(screen.getByTestId('revenue-chart')).toBeInTheDocument()
  })

  it('renders RecentActivity and UpcomingDeadlines (AC6)', async () => {
    mockGetSummary.mockResolvedValue({ success: true, data: makeSummary() } as any)
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('recent-activity')).toBeInTheDocument()
    })
    expect(screen.getByTestId('upcoming-deadlines')).toBeInTheDocument()
  })

  it('renders quick stats footer with totals (AC7)', async () => {
    mockGetSummary.mockResolvedValue({
      success: true,
      data: makeSummary({ totalTransactions: 25, dueSoonConditions: 5, monthRevenue: 22000, totalRevenue: 37000 }),
    } as any)
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument()
    })
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Total Transactions')).toBeInTheDocument()
    expect(screen.getByText('Due Soon (7 days)')).toBeInTheDocument()
  })

  it('handles nullish data with safe defaults (AC8)', async () => {
    mockGetSummary.mockResolvedValue({
      success: true,
      data: {
        totalTransactions: null,
        activeTransactions: null,
        completedTransactions: null,
        overdueConditions: null,
        dueSoonConditions: null,
        conversionRate: null,
        pipeline: null,
        revenue: null,
        totalRevenue: null,
        monthRevenue: null,
        recentActivity: null,
        upcomingDeadlines: null,
      },
    } as any)
    renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
    // Should not crash with null data
    expect(screen.getByTestId('kpi-active-transactions')).toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    mockGetSummary.mockResolvedValue({ success: true, data: makeSummary() } as any)
    const { container } = renderWithProviders(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
