import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import RecentActivity from '../RecentActivity'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(2026, 0, 27, 12, 0, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

function makeActivity(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    transactionId: 1,
    activityType: 'step_entered',
    metadata: {},
    clientName: 'Jean Dupont',
    userName: 'André Côté',
    createdAt: '2026-01-27T10:00:00Z',
    ...overrides,
  }
}

describe('RecentActivity', () => {
  it('shows empty state when no activities (AC1)', () => {
    renderWithProviders(<RecentActivity activities={[]} />)

    expect(screen.getByText('No recent activity')).toBeInTheDocument()
  })

  it('renders activity items with client name (AC2)', () => {
    renderWithProviders(
      <RecentActivity activities={[makeActivity({ id: 1, clientName: 'Marie Tremblay' })]} />
    )

    expect(screen.getByText('Marie Tremblay')).toBeInTheDocument()
  })

  it('renders activity description for step_entered with metadata (AC3)', () => {
    renderWithProviders(
      <RecentActivity
        activities={[
          makeActivity({ id: 1, activityType: 'step_entered', metadata: { stepName: 'Inspection' } }),
        ]}
      />
    )

    expect(screen.getByText('Entered step: Inspection')).toBeInTheDocument()
  })

  it('renders condition_completed description with metadata (AC4)', () => {
    renderWithProviders(
      <RecentActivity
        activities={[
          makeActivity({ id: 2, activityType: 'condition_completed', metadata: { conditionTitle: 'Financing' } }),
        ]}
      />
    )

    expect(screen.getByText('Condition completed: Financing')).toBeInTheDocument()
  })

  it('renders fallback label for unknown activity types (AC5)', () => {
    renderWithProviders(
      <RecentActivity
        activities={[makeActivity({ id: 3, activityType: 'note_added' })]}
      />
    )

    expect(screen.getByText('Note added')).toBeInTheDocument()
  })

  it('links each activity to its transaction (AC6)', () => {
    renderWithProviders(
      <RecentActivity activities={[makeActivity({ id: 1, transactionId: 42 })]} />
    )

    const link = screen.getByText('Jean Dupont').closest('a')
    expect(link).toHaveAttribute('href', '/transactions/42')
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const { container } = renderWithProviders(
      <RecentActivity activities={[makeActivity()]} />
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
