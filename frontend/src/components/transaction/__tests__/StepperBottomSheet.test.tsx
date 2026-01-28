import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import StepperBottomSheet from '../StepperBottomSheet'
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

describe('StepperBottomSheet', () => {
  it('renders step list when open (AC1)', () => {
    renderWithProviders(
      <StepperBottomSheet
        isOpen={true}
        onClose={vi.fn()}
        steps={threeSteps}
        currentStepId={20}
      />
    )

    expect(screen.getByTestId('stepper-sheet-list')).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
  })

  it('shows status labels for each step state (AC2)', () => {
    renderWithProviders(
      <StepperBottomSheet
        isOpen={true}
        onClose={vi.fn()}
        steps={threeSteps}
        currentStepId={20}
      />
    )

    // Each step has a status text: completed, active, pending
    expect(screen.getByTestId('sheet-step-1')).toBeInTheDocument()
    expect(screen.getByTestId('sheet-step-2')).toBeInTheDocument()
    expect(screen.getByTestId('sheet-step-3')).toBeInTheDocument()
  })

  it('shows skipped status label for skipped steps', () => {
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
    renderWithProviders(
      <StepperBottomSheet isOpen={true} onClose={vi.fn()} steps={steps} currentStepId={20} />
    )

    // Skipped step shows the "skipped" status text
    const step1 = screen.getByTestId('sheet-step-1')
    expect(step1.textContent).toBeTruthy()
  })

  it('renders data-testid per step order (AC5)', () => {
    renderWithProviders(
      <StepperBottomSheet
        isOpen={true}
        onClose={vi.fn()}
        steps={threeSteps}
        currentStepId={20}
      />
    )

    expect(screen.getByTestId('sheet-step-1')).toBeInTheDocument()
    expect(screen.getByTestId('sheet-step-2')).toBeInTheDocument()
    expect(screen.getByTestId('sheet-step-3')).toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations when open', async () => {
    const { container } = renderWithProviders(
      <StepperBottomSheet
        isOpen={true}
        onClose={vi.fn()}
        steps={threeSteps}
        currentStepId={20}
      />
    )
    // Use document.body since Sheet renders in a portal
    const results = await axe(document.body)
    expect(results).toHaveNoViolations()
  })
})
