import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import ActionZone from '../ActionZone'
import type { Transaction, TransactionStep } from '../../../api/transactions.api'
import type { Condition } from '../../../api/conditions.api'

const mockAdvanceStep = vi.fn()
const mockSkipStep = vi.fn()

vi.mock('../../../api/transactions.api', async () => {
  const actual = await vi.importActual('../../../api/transactions.api')
  return {
    ...(actual as object),
    transactionsApi: {
      ...(actual as any).transactionsApi,
      advanceStep: (...args: unknown[]) => mockAdvanceStep(...args),
      skipStep: (...args: unknown[]) => mockSkipStep(...args),
    },
  }
})

vi.mock('../../../hooks/use-toast', () => ({
  toast: vi.fn(),
}))

// --- Factories ---

function makeStep(overrides: Partial<TransactionStep> = {}): TransactionStep {
  return {
    id: 10,
    transactionId: 1,
    workflowStepId: 4,
    stepOrder: 4,
    status: 'active',
    enteredAt: '2025-01-10T00:00:00Z',
    completedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    workflowStep: {
      id: 4,
      name: 'Conditional Period',
      slug: 'conditional-period',
      stepOrder: 4,
      typicalDurationDays: 14,
    },
    ...overrides,
  }
}

function makeCondition(overrides: Partial<Condition> = {}): Condition {
  return {
    id: 100,
    transactionId: 1,
    transactionStepId: 10,
    title: 'Financing',
    description: null,
    status: 'pending',
    type: 'financing',
    priority: 'high',
    isBlocking: true,
    documentUrl: null,
    documentLabel: null,
    dueDate: '2025-02-01T00:00:00Z',
    completedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  const step = makeStep()
  return {
    id: 1,
    ownerUserId: 1,
    clientId: 1,
    propertyId: null,
    type: 'purchase',
    workflowTemplateId: 1,
    currentStepId: 10,
    organizationId: null,
    salePrice: null,
    notesText: null,
    listPrice: null,
    commission: null,
    folderUrl: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    currentStep: step,
    transactionSteps: [step],
    conditions: [],
    ...overrides,
  }
}

beforeEach(() => {
  mockAdvanceStep.mockReset().mockResolvedValue({ success: true, data: { newStep: null } })
  mockSkipStep.mockReset().mockResolvedValue({ success: true })
  localStorage.clear()
})

// --- Tests ---

describe('ActionZone', () => {
  it('renders nothing when the transaction is completed', () => {
    const tx = makeTx({ currentStepId: null, currentStep: undefined })
    const { container } = renderWithProviders(<ActionZone transaction={tx} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows blocking count when blocking conditions exist', () => {
    const tx = makeTx({
      conditions: [
        makeCondition({ id: 1, isBlocking: true, status: 'pending' }),
        makeCondition({ id: 2, isBlocking: true, status: 'pending' }),
      ],
    })
    renderWithProviders(<ActionZone transaction={tx} />)

    expect(screen.getByTestId('action-zone')).toBeInTheDocument()
    // The text should contain the blocking count (2)
    expect(screen.getByTestId('action-zone').textContent).toMatch(/2/)
  })

  it('shows "ready to advance" when no blocking conditions', () => {
    const tx = makeTx({ conditions: [] })
    renderWithProviders(<ActionZone transaction={tx} />)

    expect(screen.getByTestId('action-zone')).toBeInTheDocument()
    // Advance and Skip buttons should be present
    expect(screen.getByTestId('advance-step-btn')).toBeInTheDocument()
    expect(screen.getByTestId('skip-step-btn')).toBeInTheDocument()
  })

  it('calls advanceStep when advance button is clicked', async () => {
    const tx = makeTx({ conditions: [] })
    renderWithProviders(<ActionZone transaction={tx} />)

    fireEvent.click(screen.getByTestId('advance-step-btn'))

    await waitFor(() => {
      expect(mockAdvanceStep).toHaveBeenCalledWith(1)
    })
  })

  it('opens skip confirmation dialog on skip button click', () => {
    const tx = makeTx({ conditions: [] })
    renderWithProviders(<ActionZone transaction={tx} />)

    fireEvent.click(screen.getByTestId('skip-step-btn'))

    // ConfirmDialog should now be visible with skip message
    expect(screen.getByText(/Conditional Period/i)).toBeInTheDocument()
  })

  it('calls skipStep after confirming the skip dialog', async () => {
    const tx = makeTx({ conditions: [] })
    renderWithProviders(<ActionZone transaction={tx} />)

    // Open skip dialog
    fireEvent.click(screen.getByTestId('skip-step-btn'))

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Fill in the required reason (minimum 10 characters)
    const reasonInput = screen.getByPlaceholderText(/why|raison/i)
    fireEvent.change(reasonInput, { target: { value: 'Skipping this step for testing purposes' } })

    // Find and click the confirm button
    const confirmButtons = screen.getAllByRole('button')
    const skipConfirmBtn = confirmButtons.find(
      (btn) =>
        btn.textContent?.toLowerCase().includes('skip') &&
        !btn.hasAttribute('data-testid')
    )
    expect(skipConfirmBtn).toBeDefined()
    fireEvent.click(skipConfirmBtn!)

    await waitFor(() => {
      expect(mockSkipStep).toHaveBeenCalledWith(1)
    })
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const tx = makeTx({
      conditions: [makeCondition({ id: 1, isBlocking: true, status: 'pending' })],
    })
    const { container } = renderWithProviders(<ActionZone transaction={tx} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('ActionZone — blocking system', () => {
  it('shows pedagogical modal on first advance with blocking (AC1)', async () => {
    mockAdvanceStep.mockRejectedValue({
      response: {
        data: {
          error: { code: 'E_BLOCKING_CONDITIONS', blockingConditions: [{ id: 1 }] },
        },
      },
    })

    const tx = makeTx({
      conditions: [makeCondition({ id: 1, isBlocking: true, status: 'pending' })],
    })
    renderWithProviders(<ActionZone transaction={tx} />)

    fireEvent.click(screen.getByTestId('advance-step-btn'))

    await waitFor(() => {
      // Pedagogical modal should appear — look for the "don't show again" checkbox
      expect(screen.getByTestId('dont-show-again')).toBeInTheDocument()
    })
  })

  it('"don\'t show again" persists to localStorage (AC2)', async () => {
    mockAdvanceStep.mockRejectedValue({
      response: {
        data: {
          error: { code: 'E_BLOCKING_CONDITIONS', blockingConditions: [{ id: 1 }] },
        },
      },
    })

    const tx = makeTx({
      conditions: [makeCondition({ id: 1, isBlocking: true, status: 'pending' })],
    })
    renderWithProviders(<ActionZone transaction={tx} />)

    fireEvent.click(screen.getByTestId('advance-step-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('dont-show-again')).toBeInTheDocument()
    })

    // Check the "don't show again" checkbox
    fireEvent.click(screen.getByTestId('dont-show-again'))
    // Close the modal
    fireEvent.click(screen.getByTestId('blocking-modal-close'))

    expect(localStorage.getItem('ofra-blockingModalDismissed')).toBe('true')
  })

  it('shows banner instead of modal when localStorage set (AC3)', async () => {
    localStorage.setItem('ofra-blockingModalDismissed', 'true')

    mockAdvanceStep.mockRejectedValue({
      response: {
        data: {
          error: { code: 'E_BLOCKING_CONDITIONS', blockingConditions: [{ id: 1 }] },
        },
      },
    })

    const tx = makeTx({
      conditions: [makeCondition({ id: 1, isBlocking: true, status: 'pending' })],
    })
    renderWithProviders(<ActionZone transaction={tx} />)

    fireEvent.click(screen.getByTestId('advance-step-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('blocking-banner')).toBeInTheDocument()
    })

    // Modal should NOT be visible (no "don't show again" checkbox)
    expect(screen.queryByTestId('dont-show-again')).not.toBeInTheDocument()
  })

  it('banner dismiss button hides the banner (AC4)', async () => {
    localStorage.setItem('ofra-blockingModalDismissed', 'true')

    mockAdvanceStep.mockRejectedValue({
      response: {
        data: {
          error: { code: 'E_BLOCKING_CONDITIONS', blockingConditions: [{ id: 1 }] },
        },
      },
    })

    const tx = makeTx({
      conditions: [makeCondition({ id: 1, isBlocking: true, status: 'pending' })],
    })
    renderWithProviders(<ActionZone transaction={tx} />)

    fireEvent.click(screen.getByTestId('advance-step-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('blocking-banner')).toBeInTheDocument()
    })

    // Click dismiss
    const dismissBtn = screen.getByTestId('blocking-banner').querySelector('button')
    expect(dismissBtn).toBeTruthy()
    fireEvent.click(dismissBtn!)

    expect(screen.queryByTestId('blocking-banner')).not.toBeInTheDocument()
  })

  it('shows nearest deadline in days (AC5)', () => {
    const tx = makeTx({
      conditions: [
        makeCondition({
          id: 1,
          isBlocking: true,
          status: 'pending',
          dueDate: '2025-01-20T12:00:00.000Z',
        }),
      ],
    })
    renderWithProviders(<ActionZone transaction={tx} />)

    const zone = screen.getByTestId('action-zone')
    // Should contain the "j" (jours) indicator for deadline
    expect(zone.textContent).toContain('j')
  })
})
