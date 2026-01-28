import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import RevenueChart from '../RevenueChart'

describe('RevenueChart', () => {
  it('shows empty state when no revenue data (AC1)', () => {
    renderWithProviders(<RevenueChart data={[]} totalRevenue={0} monthRevenue={0} />)

    expect(screen.getByText('No commission data yet')).toBeInTheDocument()
  })

  it('shows empty state when all totals are zero (AC2)', () => {
    renderWithProviders(
      <RevenueChart
        data={[{ month: 'Jan', total: 0 }, { month: 'Feb', total: 0 }]}
        totalRevenue={0}
        monthRevenue={0}
      />
    )

    expect(screen.getByText('No commission data yet')).toBeInTheDocument()
  })

  it('renders title "Commissions" and "Last 6 months" (AC3)', () => {
    renderWithProviders(
      <RevenueChart
        data={[{ month: 'Jan', total: 15000 }]}
        totalRevenue={15000}
        monthRevenue={15000}
      />
    )

    expect(screen.getByText('Commissions')).toBeInTheDocument()
    expect(screen.getByText('Last 6 months')).toBeInTheDocument()
  })

  it('shows formatted monthly revenue (AC4)', () => {
    renderWithProviders(
      <RevenueChart
        data={[{ month: 'Jan', total: 15000 }]}
        totalRevenue={37000}
        monthRevenue={22000}
      />
    )

    expect(screen.getByText('$22K')).toBeInTheDocument()
    expect(screen.getByText('this month')).toBeInTheDocument()
  })

  it('shows total earned in footer (AC5)', () => {
    renderWithProviders(
      <RevenueChart
        data={[{ month: 'Jan', total: 15000 }]}
        totalRevenue={37000}
        monthRevenue={22000}
      />
    )

    expect(screen.getByText('Total earned')).toBeInTheDocument()
    expect(screen.getByText('$37K')).toBeInTheDocument()
  })

  it('formats millions correctly (AC6)', () => {
    renderWithProviders(
      <RevenueChart
        data={[{ month: 'Jan', total: 500000 }]}
        totalRevenue={1500000}
        monthRevenue={500000}
      />
    )

    expect(screen.getByText('$500K')).toBeInTheDocument()
    expect(screen.getByText('$1.5M')).toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const { container } = renderWithProviders(
      <RevenueChart
        data={[{ month: 'Jan', total: 15000 }]}
        totalRevenue={37000}
        monthRevenue={22000}
      />
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
