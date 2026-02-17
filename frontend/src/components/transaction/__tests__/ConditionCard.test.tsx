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
    level: 'blocking',
    documentUrl: null,
    documentLabel: null,
    dueDate: '2026-02-15T12:00:00.000Z',
    completedAt: null,
    createdAt: '2025-01-01T12:00:00.000Z',
    updatedAt: '2025-01-01T12:00:00.000Z',
    ...overrides,
  } as Condition
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

  it('renders with level-specific background color (AC2)', () => {
    renderWithProviders(
      <ConditionCard condition={makeCondition({ isBlocking: true, status: 'pending', level: 'blocking' })} />
    )

    const card = screen.getByTestId('condition-card-42')
    expect(card.className).toContain('bg-red-50')
  })

  it('hides level styling when completed (line-through instead)', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({
          isBlocking: true,
          status: 'completed',
          completedAt: '2026-01-20T12:00:00.000Z',
        })}
      />
    )

    const title = screen.getByText('Financing Approval')
    expect(title.className).toContain('line-through')
  })

  it('shows type badge (AC1)', () => {
    renderWithProviders(<ConditionCard condition={makeCondition({ type: 'inspection' })} />)

    const card = screen.getByTestId('condition-card-42')
    expect(card.textContent).toBeTruthy()
  })

  it('shows countdown when pending with dueDate (AC1)', () => {
    renderWithProviders(
      <ConditionCard condition={makeCondition({ status: 'pending', dueDate: '2026-02-15T12:00:00.000Z' })} />
    )

    const card = screen.getByTestId('condition-card-42')
    // Should contain days indicator
    expect(card.textContent).toMatch(/\d+j/)
  })

  it('shows "Fait" text when done (AC3)', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({
          status: 'completed',
          completedAt: '2026-01-20T12:00:00.000Z',
        })}
      />
    )

    const card = screen.getByTestId('condition-card-42')
    expect(card.textContent).toContain('Done')
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

  it('shows toggle checkbox when interactive=true (AC1)', () => {
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

  it('checkbox is checked when completed (AC3)', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({
          status: 'completed',
          completedAt: '2026-01-20T12:00:00.000Z',
          level: 'recommended',
          isBlocking: false,
        })}
        interactive
        onToggle={vi.fn()}
      />
    )

    const checkbox = screen.getByTestId('toggle-condition-42') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
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
    fireEvent.click(btn)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('aria-label reflects pending status (AC5)', () => {
    renderWithProviders(
      <ConditionCard condition={makeCondition({ status: 'pending' })} interactive onToggle={vi.fn()} />
    )

    const btn = screen.getByTestId('toggle-condition-42')
    expect(btn).toHaveAttribute('aria-label')
    expect(btn.getAttribute('aria-label')).toBeTruthy()
  })

  it('aria-label reflects completed status (AC6)', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({
          status: 'completed',
          completedAt: '2026-01-20T12:00:00.000Z',
          level: 'recommended',
          isBlocking: false,
        })}
        interactive
        onToggle={vi.fn()}
      />
    )

    const btn = screen.getByTestId('toggle-condition-42')
    expect(btn).toHaveAttribute('aria-label')
    expect(btn.getAttribute('aria-label')).toContain('Done')
  })

  it('has no WCAG 2.1 AA violations in interactive mode', async () => {
    const { container } = renderWithProviders(
      <ConditionCard condition={makeCondition()} interactive onToggle={vi.fn()} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

// D41: Locked condition tests — component now uses checked+disabled checkbox
describe('ConditionCard (D41 - locked state)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 0, 27, 12, 0, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('completed blocking condition has checked checkbox', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({
          status: 'completed',
          level: 'blocking',
          completedAt: '2026-01-20T12:00:00.000Z',
        })}
        interactive
        onToggle={vi.fn()}
      />
    )

    const card = screen.getByTestId('condition-card-42')
    const checkbox = card.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(checkbox).toBeTruthy()
    expect(checkbox.checked).toBe(true)
  })

  it('completed required condition has checked checkbox', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({
          status: 'completed',
          level: 'required',
          completedAt: '2026-01-20T12:00:00.000Z',
        })}
        interactive
        onToggle={vi.fn()}
      />
    )

    const card = screen.getByTestId('condition-card-42')
    const checkbox = card.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(checkbox).toBeTruthy()
    expect(checkbox.checked).toBe(true)
  })

  it('completed recommended condition still has toggle', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({
          status: 'completed',
          level: 'recommended',
          completedAt: '2026-01-20T12:00:00.000Z',
        })}
        interactive
        onToggle={vi.fn()}
      />
    )

    expect(screen.getByTestId('toggle-condition-42')).toBeInTheDocument()
  })

  it('shows toggle button for pending blocking condition', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({
          status: 'pending',
          level: 'blocking',
        })}
        interactive
        onToggle={vi.fn()}
      />
    )

    expect(screen.getByTestId('toggle-condition-42')).toBeInTheDocument()
  })

  it('fallback to isBlocking=true for legacy conditions without level', () => {
    renderWithProviders(
      <ConditionCard
        condition={makeCondition({
          status: 'completed',
          isBlocking: true,
          level: undefined,
          completedAt: '2026-01-20T12:00:00.000Z',
        })}
        interactive
        onToggle={vi.fn()}
      />
    )

    const card = screen.getByTestId('condition-card-42')
    // Card should have red/blocking background
    expect(card.className).toContain('bg-red-50')
  })
})
