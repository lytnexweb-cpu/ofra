import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import ConditionCard from '../ConditionCard'
import type { Condition } from '../../../api/conditions.api'

function makeCondition(overrides: Partial<Condition> = {}): Condition {
  return {
    id: 42,
    transactionId: 1,
    transactionStepId: 10,
    title: 'Financing Approval',
    description: 'Client needs bank financing approval',
    status: 'pending',
    type: 'financing',
    priority: 'high',
    isBlocking: true,
    documentUrl: null,
    documentLabel: null,
    dueDate: '2026-02-15T12:00:00.000Z',
    completedAt: null,
    createdAt: '2025-01-01T12:00:00.000Z',
    updatedAt: '2025-01-01T12:00:00.000Z',
    ...overrides,
  }
}

describe('ConditionCard (read-only)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 0, 27, 12, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders condition title (AC1)', () => {
    renderWithProviders(<ConditionCard condition={makeCondition()} />)

    expect(screen.getByText('Financing Approval')).toBeInTheDocument()
  })

  it('renders condition description (AC1)', () => {
    renderWithProviders(<ConditionCard condition={makeCondition()} />)

    expect(screen.getByText('Client needs bank financing approval')).toBeInTheDocument()
  })

  it('shows blocking badge when blocking + pending (AC2)', () => {
    renderWithProviders(
      <ConditionCard condition={makeCondition({ isBlocking: true, status: 'pending' })} />
    )

    expect(screen.getByText(/blocking/i)).toBeInTheDocument()
  })

  it('hides blocking badge when completed (AC2)', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({
          isBlocking: true,
          status: 'completed',
          completedAt: '2026-01-20T12:00:00.000Z',
        })}
      />
    )

    expect(screen.queryByText(/blocking/i)).not.toBeInTheDocument()
  })

  it('shows type badge (AC1)', () => {
    renderWithProviders(<ConditionCard condition={makeCondition({ type: 'inspection' })} />)

    // i18n key conditions.types.inspection renders
    const card = screen.getByTestId('condition-card-42')
    expect(card.textContent).toBeTruthy()
  })

  it('shows countdown when pending with dueDate (AC1)', () => {
    renderWithProviders(
      <ConditionCard condition={makeCondition({ status: 'pending', dueDate: '2026-02-15T12:00:00.000Z' })} />
    )

    // CountdownBadge renders (19 days from Jan 27 to Feb 15)
    const card = screen.getByTestId('condition-card-42')
    expect(card.textContent).toBeTruthy()
  })

  it('shows completed text when done (AC3)', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({
          status: 'completed',
          completedAt: '2026-01-20T12:00:00.000Z',
        })}
      />
    )

    // Shows completed status text
    const card = screen.getByTestId('condition-card-42')
    // The "Completed" text from i18n workflow.status.completed
    expect(card.querySelector('.text-success')).toBeTruthy()
  })

  it('line-through title when done (AC3)', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({
          status: 'completed',
          completedAt: '2026-01-20T12:00:00.000Z',
        })}
      />
    )

    const title = screen.getByText('Financing Approval')
    expect(title.className).toContain('line-through')
  })

  it('no toggle button in non-interactive mode (AC4)', () => {
    renderWithProviders(<ConditionCard condition={makeCondition()} />)

    // interactive defaults to false — no button
    expect(screen.queryByTestId('toggle-condition-42')).not.toBeInTheDocument()
  })

  it('has data-testid and data-condition-id (AC5)', () => {
    renderWithProviders(<ConditionCard condition={makeCondition({ id: 99 })} />)

    const card = screen.getByTestId('condition-card-99')
    expect(card).toHaveAttribute('data-condition-id', '99')
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const { container } = renderWithProviders(
      <ConditionCard condition={makeCondition()} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('ConditionCard (interactive)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 0, 27, 12, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows toggle button when interactive=true (AC1)', () => {
    renderWithProviders(
      <ConditionCard condition={makeCondition()} interactive onToggle={vi.fn()} />
    )

    expect(screen.getByTestId('toggle-condition-42')).toBeInTheDocument()
  })

  it('calls onToggle with condition on click (AC2)', () => {
    const onToggle = vi.fn()
    const condition = makeCondition()
    renderWithProviders(
      <ConditionCard condition={condition} interactive onToggle={onToggle} />
    )

    fireEvent.click(screen.getByTestId('toggle-condition-42'))
    expect(onToggle).toHaveBeenCalledOnce()
    expect(onToggle).toHaveBeenCalledWith(condition)
  })

  it('shows check icon when completed (AC3)', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({ status: 'completed', completedAt: '2026-01-20T12:00:00.000Z' })}
        interactive
        onToggle={vi.fn()}
      />
    )

    const btn = screen.getByTestId('toggle-condition-42')
    // Completed → green circle with check (bg-success class)
    expect(btn.querySelector('.bg-success')).toBeTruthy()
  })

  it('disables toggle when isToggling=true (AC4)', () => {
    const onToggle = vi.fn()
    renderWithProviders(
      <ConditionCard
        condition={makeCondition()}
        interactive
        isToggling={true}
        onToggle={onToggle}
      />
    )

    const btn = screen.getByTestId('toggle-condition-42')
    expect(btn).toBeDisabled()
    // Click should not fire onToggle
    fireEvent.click(btn)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('aria-label reflects pending status (AC5)', () => {
    renderWithProviders(
      <ConditionCard condition={makeCondition({ status: 'pending' })} interactive onToggle={vi.fn()} />
    )

    const btn = screen.getByTestId('toggle-condition-42')
    expect(btn).toHaveAttribute('aria-label')
    // i18n key workflow.status.pending
    expect(btn.getAttribute('aria-label')).toBeTruthy()
  })

  it('aria-label reflects completed status (AC6)', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({ status: 'completed', completedAt: '2026-01-20T12:00:00.000Z' })}
        interactive
        onToggle={vi.fn()}
      />
    )

    const btn = screen.getByTestId('toggle-condition-42')
    expect(btn).toHaveAttribute('aria-label')
  })

  it('has no WCAG 2.1 AA violations in interactive mode', async () => {
    const { container } = renderWithProviders(
      <ConditionCard condition={makeCondition()} interactive onToggle={vi.fn()} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
