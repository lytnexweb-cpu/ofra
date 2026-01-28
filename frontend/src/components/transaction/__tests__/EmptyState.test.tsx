import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import EmptyState from '../EmptyState'

describe('EmptyState', () => {
  it('renders title, description, and CTA button (AC1)', () => {
    renderWithProviders(<EmptyState onCreateClick={vi.fn()} />)

    expect(screen.getByText('No transactions yet')).toBeInTheDocument()
    expect(screen.getByText('Create your first transaction to get started')).toBeInTheDocument()
    expect(screen.getByTestId('empty-state-cta')).toBeInTheDocument()
  })

  it('calls onCreateClick when CTA is clicked (AC2)', () => {
    const onClick = vi.fn()
    renderWithProviders(<EmptyState onCreateClick={onClick} />)

    fireEvent.click(screen.getByTestId('empty-state-cta'))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('has data-testid="empty-state"', () => {
    renderWithProviders(<EmptyState onCreateClick={vi.fn()} />)

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const { container } = renderWithProviders(<EmptyState onCreateClick={vi.fn()} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
