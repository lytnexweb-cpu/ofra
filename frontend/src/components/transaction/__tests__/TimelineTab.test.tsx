import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import TimelineTab from '../TimelineTab'
import { transactionsApi, type ActivityEntry } from '../../../api/transactions.api'

vi.mock('../../../api/transactions.api', async () => {
  const actual = await vi.importActual<typeof import('../../../api/transactions.api')>(
    '../../../api/transactions.api'
  )
  return {
    ...actual,
    transactionsApi: { ...actual.transactionsApi, getActivity: vi.fn() },
  }
})

const mockGetActivity = vi.mocked(transactionsApi.getActivity)

function makeActivity(overrides: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    id: 1,
    transactionId: 1,
    userId: 1,
    activityType: 'step_advanced',
    metadata: {},
    createdAt: '2026-01-26T12:00:00.000Z',
    user: { id: 1, fullName: 'André Côté', email: 'andre@example.com' },
    ...overrides,
  }
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(2026, 0, 27, 12, 0, 0))
  mockGetActivity.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('TimelineTab', () => {
  it('shows empty state when no activities (AC1)', async () => {
    mockGetActivity.mockResolvedValue({
      success: true,
      data: { data: [], meta: { total: 0, perPage: 20, currentPage: 1 } },
    } as any)

    renderWithProviders(<TimelineTab transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('timeline-empty')).toBeInTheDocument()
    })
  })

  it('renders activity list with activity types (AC2)', async () => {
    mockGetActivity.mockResolvedValue({
      success: true,
      data: {
        data: [
          makeActivity({ id: 1, activityType: 'step_advanced' }),
          makeActivity({ id: 2, activityType: 'condition_completed' }),
        ],
        meta: { total: 2, perPage: 20, currentPage: 1 },
      },
    } as any)

    renderWithProviders(<TimelineTab transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('timeline-tab')).toBeInTheDocument()
    })

    expect(screen.getByTestId('activity-1')).toBeInTheDocument()
    expect(screen.getByTestId('activity-2')).toBeInTheDocument()
    // Activity type text rendered
    expect(screen.getByText('step advanced')).toBeInTheDocument()
    expect(screen.getByText('condition completed')).toBeInTheDocument()
  })

  it('shows user name on activities (AC3)', async () => {
    mockGetActivity.mockResolvedValue({
      success: true,
      data: {
        data: [makeActivity({ id: 1, user: { id: 1, fullName: 'Jean Tremblay', email: 'jean@test.com' } })],
        meta: { total: 1, perPage: 20, currentPage: 1 },
      },
    } as any)

    renderWithProviders(<TimelineTab transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByText('Jean Tremblay')).toBeInTheDocument()
    })
  })

  it('shows "Load More" button when hasMore (AC4)', async () => {
    mockGetActivity.mockResolvedValue({
      success: true,
      data: {
        data: [makeActivity({ id: 1 })],
        meta: { total: 25, perPage: 20, currentPage: 1 },
      },
    } as any)

    renderWithProviders(<TimelineTab transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('load-more-activities')).toBeInTheDocument()
    })
  })

  it('hides "Load More" when all loaded', async () => {
    mockGetActivity.mockResolvedValue({
      success: true,
      data: {
        data: [makeActivity({ id: 1 })],
        meta: { total: 1, perPage: 20, currentPage: 1 },
      },
    } as any)

    renderWithProviders(<TimelineTab transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('timeline-tab')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('load-more-activities')).not.toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    mockGetActivity.mockResolvedValue({
      success: true,
      data: {
        data: [makeActivity({ id: 1 })],
        meta: { total: 1, perPage: 20, currentPage: 1 },
      },
    } as any)

    const { container } = renderWithProviders(<TimelineTab transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('timeline-tab')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('TimelineTab — resilience', () => {
  it('does not crash when getActivity API rejects (network error)', async () => {
    mockGetActivity.mockRejectedValue(new Error('Network error'))

    renderWithProviders(<TimelineTab transactionId={1} />)

    // Should show empty state after query fails (no data)
    await waitFor(() => {
      expect(screen.getByTestId('timeline-empty')).toBeInTheDocument()
    })
  })
})
