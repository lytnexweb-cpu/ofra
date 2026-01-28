import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import PipelineChart from '../PipelineChart'

// Recharts ResponsiveContainer doesn't render in JSDOM, but text content does
describe('PipelineChart', () => {
  it('shows empty state when no data (AC1)', () => {
    renderWithProviders(<PipelineChart data={[]} />)

    expect(screen.getByText('No active transactions')).toBeInTheDocument()
    expect(screen.getByText(/0 active transaction/)).toBeInTheDocument()
  })

  it('renders title "Pipeline" (AC2)', () => {
    renderWithProviders(
      <PipelineChart data={[{ slug: 'consultation', name: 'Consultation', count: 4 }]} />
    )

    expect(screen.getByText('Pipeline')).toBeInTheDocument()
  })

  it('shows total active transactions count (AC3)', () => {
    renderWithProviders(
      <PipelineChart
        data={[
          { slug: 'consultation', name: 'Consultation', count: 4 },
          { slug: 'inspection', name: 'Inspection', count: 3 },
        ]}
      />
    )

    expect(screen.getByText('7 active transactions')).toBeInTheDocument()
  })

  it('renders legend with step names and counts (AC4)', () => {
    renderWithProviders(
      <PipelineChart
        data={[
          { slug: 'consultation', name: 'Consultation', count: 4 },
          { slug: 'inspection', name: 'Inspection', count: 3 },
        ]}
      />
    )

    expect(screen.getByText('Consultation: 4')).toBeInTheDocument()
    expect(screen.getByText('Inspection: 3')).toBeInTheDocument()
  })

  it('handles null data gracefully', () => {
    renderWithProviders(<PipelineChart data={null as any} />)

    expect(screen.getByText('No active transactions')).toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const { container } = renderWithProviders(
      <PipelineChart data={[{ slug: 'step', name: 'Step 1', count: 5 }]} />
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
