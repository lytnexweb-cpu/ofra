import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import UpcomingDeadlines from '../UpcomingDeadlines'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(2026, 0, 27, 12, 0, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

function makeDeadline(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    title: 'Financing Approval',
    dueDate: '2026-01-30T12:00:00Z',
    transactionId: 1,
    clientName: 'Jean Dupont',
    priority: 'high' as const,
    isBlocking: false,
    ...overrides,
  }
}

describe('UpcomingDeadlines', () => {
  it('shows empty state when no deadlines (AC1)', () => {
    renderWithProviders(<UpcomingDeadlines deadlines={[]} />)

    expect(screen.getByText('No upcoming deadlines')).toBeInTheDocument()
  })

  it('renders title "Upcoming Deadlines" (AC2)', () => {
    renderWithProviders(<UpcomingDeadlines deadlines={[makeDeadline()]} />)

    expect(screen.getByText('Upcoming Deadlines')).toBeInTheDocument()
  })

  it('shows deadline count badge when deadlines exist (AC3)', () => {
    renderWithProviders(
      <UpcomingDeadlines deadlines={[makeDeadline({ id: 1 }), makeDeadline({ id: 2 })]} />
    )

    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders deadline title and client name (AC4)', () => {
    renderWithProviders(
      <UpcomingDeadlines deadlines={[makeDeadline({ title: 'Inspection', clientName: 'Marie' })]} />
    )

    expect(screen.getByText('Inspection')).toBeInTheDocument()
    expect(screen.getByText('Marie')).toBeInTheDocument()
  })

  it('shows "Blocking" badge for blocking conditions (AC5)', () => {
    renderWithProviders(
      <UpcomingDeadlines deadlines={[makeDeadline({ isBlocking: true })]} />
    )

    expect(screen.getByText('Blocking')).toBeInTheDocument()
  })

  it('shows priority badge (AC6)', () => {
    renderWithProviders(
      <UpcomingDeadlines deadlines={[makeDeadline({ priority: 'high' })]} />
    )

    expect(screen.getByText('high')).toBeInTheDocument()
  })

  it('shows days until due (AC7)', () => {
    // 5 days from now — avoids timezone edge cases
    renderWithProviders(
      <UpcomingDeadlines deadlines={[makeDeadline({ dueDate: '2026-02-01T23:59:00Z' })]} />
    )

    expect(screen.getByText(/\d+ days/)).toBeInTheDocument()
  })

  it('shows "Overdue" for past deadlines (AC8)', () => {
    renderWithProviders(
      <UpcomingDeadlines deadlines={[makeDeadline({ dueDate: '2026-01-25T12:00:00Z' })]} />
    )

    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })

  it('shows "Due today" for today deadlines (AC9)', () => {
    renderWithProviders(
      <UpcomingDeadlines deadlines={[makeDeadline({ dueDate: '2026-01-27T23:59:00Z' })]} />
    )

    expect(screen.getByText('Due today')).toBeInTheDocument()
  })

  it('shows "No date" when dueDate is null (AC10)', () => {
    renderWithProviders(
      <UpcomingDeadlines deadlines={[makeDeadline({ dueDate: null })]} />
    )

    expect(screen.getByText('No date')).toBeInTheDocument()
  })

  it('links each deadline to its transaction (AC11)', () => {
    renderWithProviders(
      <UpcomingDeadlines deadlines={[makeDeadline({ transactionId: 42 })]} />
    )

    const link = screen.getByText('Financing Approval').closest('a')
    expect(link).toHaveAttribute('href', '/transactions/42')
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const { container } = renderWithProviders(
      <UpcomingDeadlines
        deadlines={[makeDeadline({ isBlocking: true }), makeDeadline({ id: 2, priority: 'low', isBlocking: false })]}
      />
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
