import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import StepperPill from '../StepperPill'
import type { TransactionStep } from '../../../api/transactions.api'

function makeStep(overrides: Partial<TransactionStep> = {}): TransactionStep {
  return {
    id: 10,
    transactionId: 1,
    workflowStepId: 1,
    stepOrder: 1,
    status: 'active',
    enteredAt: '2025-01-01T12:00:00.000Z',
    completedAt: null,
    createdAt: '2025-01-01T12:00:00.000Z',
    updatedAt: '2025-01-01T12:00:00.000Z',
    workflowStep: {
      id: 1,
      name: 'Consultation',
      slug: 'consultation',
      stepOrder: 1,
      typicalDurationDays: null,
    },
    ...overrides,
  }
}

const threeSteps: TransactionStep[] = [
  makeStep({ id: 10, stepOrder: 1, status: 'completed', completedAt: '2025-01-05T12:00:00.000Z' }),
  makeStep({
    id: 20,
    workflowStepId: 2,
    stepOrder: 2,
    status: 'active',
    workflowStep: { id: 2, name: 'Offer Submitted', slug: 'offer-submitted', stepOrder: 2, typicalDurationDays: 3 },
  }),
  makeStep({
    id: 30,
    workflowStepId: 3,
    stepOrder: 3,
    status: 'pending',
    workflowStep: { id: 3, name: 'Closing', slug: 'closing', stepOrder: 3, typicalDurationDays: 5 },
  }),
]

describe('StepperPill', () => {
  it('renders step X/Y and current step name (AC4)', () => {
    renderWithProviders(
      <StepperPill steps={threeSteps} currentStepId={20} />
    )

    // Step 2 of 3: "Step 2/3 — Offer Submitted"
    const pill = screen.getByTestId('stepper-pill')
    expect(pill.textContent).toContain('2/3')
    expect(pill.textContent).toContain('Offer Submitted')
  })

  it('progress bar has correct aria attributes (AC6)', () => {
    renderWithProviders(
      <StepperPill steps={threeSteps} currentStepId={20} />
    )

    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '2')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '3')
  })

  it('calls onClick when pill is clicked (AC5)', () => {
    const onClick = vi.fn()
    renderWithProviders(
      <StepperPill steps={threeSteps} currentStepId={20} onClick={onClick} />
    )

    fireEvent.click(screen.getByTestId('stepper-pill'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('has data-testid="stepper-pill"', () => {
    renderWithProviders(
      <StepperPill steps={threeSteps} currentStepId={20} />
    )

    expect(screen.getByTestId('stepper-pill')).toBeInTheDocument()
  })

  it('has accessible aria-label on button', () => {
    renderWithProviders(
      <StepperPill steps={threeSteps} currentStepId={20} />
    )

    const pill = screen.getByTestId('stepper-pill')
    expect(pill).toHaveAttribute('aria-label')
    expect(pill.getAttribute('aria-label')).toContain('2/3')
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const { container } = renderWithProviders(
      <StepperPill steps={threeSteps} currentStepId={20} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
