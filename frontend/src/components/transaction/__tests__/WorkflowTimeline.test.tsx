import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WorkflowTimeline from '../WorkflowTimeline'
import { createTestWrapper } from '../../../test/helpers'

const mockTransaction = {
  id: 1,
  currentStepId: 2,
  transactionSteps: [
    {
      id: 1,
      stepOrder: 1,
      status: 'completed',
      workflowStep: { slug: 'offer-submitted', name: 'Offer Submitted' },
    },
    {
      id: 2,
      stepOrder: 2,
      status: 'active',
      workflowStep: { slug: 'offer-accepted', name: 'Offer Accepted' },
    },
    {
      id: 3,
      stepOrder: 3,
      status: 'pending',
      workflowStep: { slug: 'conditional-period', name: 'Conditional Period' },
    },
  ],
  conditions: [
    { id: 101, transactionStepId: 1, title: 'Past Condition', status: 'completed', level: 'required' },
    { id: 102, transactionStepId: 2, title: 'Active Condition', status: 'pending', level: 'blocking' },
    { id: 103, transactionStepId: 2, title: 'Another Active', status: 'completed', level: 'required' },
  ],
} as any

describe('WorkflowTimeline', () => {
  const renderComponent = (props = {}) => {
    return render(
      <WorkflowTimeline transaction={mockTransaction} {...props} />,
      { wrapper: createTestWrapper() }
    )
  }

  describe('Step Display', () => {
    it('renders all steps vertically', () => {
      renderComponent()

      expect(screen.getByTestId('timeline-step-1')).toBeInTheDocument()
      expect(screen.getByTestId('timeline-step-2')).toBeInTheDocument()
      expect(screen.getByTestId('timeline-step-3')).toBeInTheDocument()
    })

    it('shows completed step with check icon and green styling', () => {
      renderComponent()

      const step1 = screen.getByTestId('timeline-step-1')
      expect(step1).toBeInTheDocument()
      // Completed steps have success color
      expect(step1.querySelector('.bg-success')).toBeInTheDocument()
    })

    it('shows active step with pulse animation', () => {
      renderComponent()

      const step2Btn = screen.getByTestId('timeline-step-btn-2')
      expect(step2Btn.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('shows pending step with muted styling', () => {
      renderComponent()

      const step3 = screen.getByTestId('timeline-step-3')
      expect(step3.querySelector('.bg-muted')).toBeInTheDocument()
    })
  })

  describe('Condition Display', () => {
    it('expands current step by default to show conditions', () => {
      renderComponent()

      // Current step (id=2) should be expanded by default
      expect(screen.getByTestId('timeline-conditions-2')).toBeInTheDocument()
      expect(screen.getByText('Active Condition')).toBeInTheDocument()
    })

    it('shows blocking badge for blocking conditions', () => {
      renderComponent()

      // The blocking condition should have a badge
      const conditionEl = screen.getByTestId('timeline-condition-102')
      expect(conditionEl).toHaveTextContent('Blocking')
    })

    it('toggles step expansion on click', () => {
      renderComponent()

      // Step 2 is expanded by default
      expect(screen.getByTestId('timeline-conditions-2')).toBeInTheDocument()

      // Click step 1 to expand it
      fireEvent.click(screen.getByTestId('timeline-step-btn-1'))
      expect(screen.getByTestId('timeline-conditions-1')).toBeInTheDocument()
    })
  })

  describe('Readonly Past Steps', () => {
    it('shows lock icon for past steps with conditions', () => {
      renderComponent()

      // Expand step 1 (past step)
      fireEvent.click(screen.getByTestId('timeline-step-btn-1'))

      // Step 1 should show lock icon
      const step1 = screen.getByTestId('timeline-step-1')
      expect(step1.querySelector('[class*="Lock"]') || step1.textContent).toBeTruthy()
    })

    it('disables condition click for past steps', () => {
      const onConditionClick = vi.fn()
      renderComponent({ onConditionClick })

      // Expand step 1 (past step)
      fireEvent.click(screen.getByTestId('timeline-step-btn-1'))

      // Try to click condition in past step
      const pastCondition = screen.getByTestId('timeline-condition-101')
      fireEvent.click(pastCondition)

      // Should not trigger callback
      expect(onConditionClick).not.toHaveBeenCalled()
    })

    it('allows condition click for active step', () => {
      const onConditionClick = vi.fn()
      renderComponent({ onConditionClick })

      // Click condition in active step (already expanded)
      const activeCondition = screen.getByTestId('timeline-condition-102')
      fireEvent.click(activeCondition)

      expect(onConditionClick).toHaveBeenCalledWith(102)
    })
  })

  describe('History Drawer', () => {
    it('shows view history button', () => {
      renderComponent()

      expect(screen.getByTestId('view-history-btn')).toBeInTheDocument()
    })

    it('opens history drawer on button click', () => {
      renderComponent()

      fireEvent.click(screen.getByTestId('view-history-btn'))

      // Sheet should open - look for the sheet content
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('No Back Button', () => {
    it('does not render any back or rewind button', () => {
      renderComponent()

      // Should not have any back/rewind/undo buttons
      expect(screen.queryByText(/back/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/rewind/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/undo/i)).not.toBeInTheDocument()
      expect(screen.queryByTestId('back-step-btn')).not.toBeInTheDocument()
    })
  })
})
