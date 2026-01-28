import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import StepProgressBar from '../StepProgressBar'
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

describe('StepProgressBar', () => {
  it('renders all steps as listitems (AC1, AC2)', () => {
    renderWithProviders(<StepProgressBar steps={threeSteps} currentStepId={20} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
  })

  it('has role="list" with accessible aria-label (AC2)', () => {
    renderWithProviders(<StepProgressBar steps={threeSteps} currentStepId={20} />)

    const list = screen.getByRole('list')
    expect(list).toHaveAttribute('aria-label')
  })

  it('shows step number for pending steps (AC1)', () => {
    renderWithProviders(<StepProgressBar steps={threeSteps} currentStepId={20} />)

    // Step 3 is pending → shows number "3"
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders step labels from workflow step name (AC3)', () => {
    renderWithProviders(<StepProgressBar steps={threeSteps} currentStepId={20} />)

    // i18n resolves workflow.steps.{slug} — may differ from raw name
    // Check via title attribute which always has the resolved label
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    items.forEach((item) => {
      const label = item.querySelector('[title]')
      expect(label).toBeTruthy()
      expect(label!.textContent!.trim().length).toBeGreaterThan(0)
    })
  })

  it('appends "(skipped)" label for skipped steps', () => {
    const steps = [
      makeStep({ id: 10, stepOrder: 1, status: 'skipped' }),
      makeStep({
        id: 20,
        workflowStepId: 2,
        stepOrder: 2,
        status: 'active',
        workflowStep: { id: 2, name: 'Step 2', slug: 'step-2', stepOrder: 2, typicalDurationDays: null },
      }),
    ]
    renderWithProviders(<StepProgressBar steps={steps} currentStepId={20} />)

    // skipped label is appended
    const labels = screen.getAllByRole('listitem')
    expect(labels[0].textContent).toContain('skipped')
  })

  it('has data-testid="step-progress-bar"', () => {
    renderWithProviders(<StepProgressBar steps={threeSteps} currentStepId={20} />)

    expect(screen.getByTestId('step-progress-bar')).toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const { container } = renderWithProviders(
      <StepProgressBar steps={threeSteps} currentStepId={20} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
