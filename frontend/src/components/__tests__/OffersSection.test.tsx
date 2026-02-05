import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../test/helpers'
import OffersSection from '../OffersSection'
import type { Offer } from '../../api/transactions.api'

const mockList = vi.fn()
const mockAccept = vi.fn()
const mockReject = vi.fn()

vi.mock('../../api/offers.api', async () => {
  const actual = await vi.importActual('../../api/offers.api')
  return {
    ...(actual as object),
    offersApi: {
      list: (...args: unknown[]) => mockList(...args),
      accept: (...args: unknown[]) => mockAccept(...args),
      reject: (...args: unknown[]) => mockReject(...args),
      withdraw: vi.fn().mockResolvedValue({ success: true }),
      delete: vi.fn().mockResolvedValue({ success: true }),
    },
  }
})

// Mock child modals
vi.mock('../CreateOfferModal', () => ({
  default: () => null,
}))
vi.mock('../CounterOfferModal', () => ({
  default: () => null,
}))

vi.mock('../../utils/apiError', () => ({
  parseApiError: () => ({ title: 'Error', message: 'Something went wrong' }),
  isSessionExpired: () => false,
}))

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: 1,
    transactionId: 1,
    status: 'received',
    acceptedAt: null,
    createdAt: '2026-01-20T12:00:00.000Z',
    updatedAt: '2026-01-20T12:00:00.000Z',
    revisions: [
      {
        id: 1,
        offerId: 1,
        revisionNumber: 1,
        price: 450000,
        deposit: 25000,
        financingAmount: 400000,
        expiryAt: '2026-02-01T12:00:00.000Z',
        notes: 'Initial offer',
        direction: 'buyer_to_seller',
        createdByUserId: 1,
        createdAt: '2026-01-20T12:00:00.000Z',
      },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  mockList.mockReset().mockResolvedValue({
    success: true,
    data: { offers: [] },
  })
  mockAccept.mockReset().mockResolvedValue({ success: true })
  mockReject.mockReset().mockResolvedValue({ success: true })
})

describe('OffersSection', () => {
  it('shows empty state when no offers (AC1)', async () => {
    renderWithProviders(
      <OffersSection transactionId={1} transactionStatus="Active" />
    )

    await waitFor(() => {
      expect(screen.getByText('No offers yet.')).toBeInTheDocument()
    })
  })

  it('shows loading text initially', () => {
    mockList.mockReturnValue(new Promise(() => {})) // never resolves
    renderWithProviders(
      <OffersSection transactionId={1} transactionStatus="Active" />
    )

    expect(screen.getByText('Loading offers...')).toBeInTheDocument()
  })

  it('renders offer with status badge and price (AC2)', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: { offers: [makeOffer({ id: 1, status: 'received' })] },
    })

    renderWithProviders(
      <OffersSection transactionId={1} transactionStatus="Active" />
    )

    await waitFor(() => {
      expect(screen.getByText('Received')).toBeInTheDocument()
    })

    // Price formatted as CAD
    expect(screen.getByText('$450,000')).toBeInTheDocument()
  })

  it('renders "New Offer" button (AC3)', async () => {
    renderWithProviders(
      <OffersSection transactionId={1} transactionStatus="Active" />
    )

    await waitFor(() => {
      expect(screen.getByText('+ New offer')).toBeInTheDocument()
    })
  })

  it('shows action buttons for received offers when expanded (AC4)', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: { offers: [makeOffer({ id: 1, status: 'received' })] },
    })

    renderWithProviders(
      <OffersSection transactionId={1} transactionStatus="Active" />
    )

    await waitFor(() => {
      expect(screen.getByText('Received')).toBeInTheDocument()
    })

    // Click to expand
    fireEvent.click(screen.getByText('$450,000'))

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument()
    })

    expect(screen.getByText('Counter')).toBeInTheDocument()
    expect(screen.getByText('Reject')).toBeInTheDocument()
    expect(screen.getByText('Withdraw')).toBeInTheDocument()
  })

  it('shows revision history when expanded (AC5)', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: { offers: [makeOffer({ id: 1 })] },
    })

    renderWithProviders(
      <OffersSection transactionId={1} transactionStatus="Active" />
    )

    await waitFor(() => {
      expect(screen.getByText('$450,000')).toBeInTheDocument()
    })

    // Expand
    fireEvent.click(screen.getByText('$450,000'))

    await waitFor(() => {
      expect(screen.getByText('Revision History')).toBeInTheDocument()
    })

    expect(screen.getByText('#1')).toBeInTheDocument()
  })

  it('shows direction label on offer (AC6)', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: { offers: [makeOffer({ id: 1 })] },
    })

    renderWithProviders(
      <OffersSection transactionId={1} transactionStatus="Active" />
    )

    await waitFor(() => {
      expect(screen.getByText('Buyer → Seller')).toBeInTheDocument()
    })
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: { offers: [makeOffer({ id: 1 })] },
    })

    const { container } = renderWithProviders(
      <OffersSection transactionId={1} transactionStatus="Active" />
    )

    await waitFor(() => {
      expect(screen.getByText('$450,000')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('OffersSection — resilience', () => {
  it('does not crash when list API rejects (network error)', async () => {
    mockList.mockRejectedValue(new Error('Network error'))

    renderWithProviders(
      <OffersSection transactionId={1} transactionStatus="Active" />
    )

    // Should show loading, then not crash — "New Offer" button still accessible
    await waitFor(() => {
      expect(screen.getByText('+ New offer')).toBeInTheDocument()
    })
  })

  it('shows empty state when list returns non-success response', async () => {
    mockList.mockResolvedValue({ success: false, error: { message: 'Unauthorized' } })

    renderWithProviders(
      <OffersSection transactionId={1} transactionStatus="Active" />
    )

    await waitFor(() => {
      expect(screen.getByText('No offers yet.')).toBeInTheDocument()
    })
  })
})
