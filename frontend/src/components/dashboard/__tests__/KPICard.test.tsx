import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, act } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import KPICard from '../KPICard'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('KPICard', () => {
  const icon = <svg data-testid="kpi-icon"><circle cx="12" cy="12" r="10" /></svg>

  it('renders title and animated value (AC1)', async () => {
    renderWithProviders(<KPICard title="Active Transactions" value={12} color="blue" icon={icon} />)

    expect(screen.getByText('Active Transactions')).toBeInTheDocument()
    // Advance timers and flush React state updates
    await act(async () => { vi.advanceTimersByTime(1200) })
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders prefix and suffix (AC2)', async () => {
    renderWithProviders(<KPICard title="Rate" value={40} color="purple" icon={icon} suffix="%" prefix="~" />)

    await act(async () => { vi.advanceTimersByTime(1200) })
    // prefix + value + suffix rendered inside a span
    const span = screen.getByText(/40/)
    expect(span.textContent).toContain('~')
    expect(span.textContent).toContain('%')
  })

  it('renders icon in color-themed container (AC3)', () => {
    renderWithProviders(<KPICard title="Test" value={5} color="green" icon={icon} />)

    expect(screen.getByTestId('kpi-icon')).toBeInTheDocument()
  })

  it('renders positive trend indicator (AC4)', () => {
    renderWithProviders(
      <KPICard title="Revenue" value={100} color="green" icon={icon} trend={{ value: 15, isPositive: true }} />
    )

    expect(screen.getByText('15%')).toBeInTheDocument()
  })

  it('renders negative trend indicator (AC5)', () => {
    renderWithProviders(
      <KPICard title="Churn" value={8} color="red" icon={icon} trend={{ value: 3, isPositive: false }} />
    )

    expect(screen.getByText('3%')).toBeInTheDocument()
  })

  it('renders without trend when not provided', () => {
    renderWithProviders(<KPICard title="Simple" value={0} color="blue" icon={icon} />)

    expect(screen.getByText('Simple')).toBeInTheDocument()
    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const { container } = renderWithProviders(
      <KPICard title="Active" value={12} color="blue" icon={icon} trend={{ value: 10, isPositive: true }} />
    )

    await act(async () => { vi.advanceTimersByTime(1200) })
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
