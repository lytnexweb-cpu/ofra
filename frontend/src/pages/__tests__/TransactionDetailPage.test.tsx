import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders } from '../../test/helpers'
import TransactionDetailPage from '../TransactionDetailPage'
import { transactionsApi, type Transaction, type TransactionStep } from '../../api/transactions.api'

// Mock child components to keep tests focused on page-level behavior
vi.mock('../../components/transaction', () => ({
  TransactionHeader: () => <div data-testid="transaction-header">Header</div>,
  MembersPanel: () => null,
  PropertyProfileCard: () => <div data-testid="property-profile-card">Property</div>,
  PartiesCard: () => <div data-testid="parties-card">Parties</div>,
  OffersPanel: () => <div data-testid="offers-panel">Offers</div>,
  PartiesModal: () => null,
  UploadDocumentModal: () => null,
  DocumentProofModal: () => null,
  DocumentVersionModal: () => null,
  DocumentStatusBar: () => <div data-testid="document-status-bar">Docs</div>,
  DocumentsSection: () => null,
}))
vi.mock('../../components/transaction/VerticalTimeline', () => ({
  default: () => <div data-testid="vertical-timeline">Timeline</div>,
}))
vi.mock('../../api/documents.api', () => ({
  documentsApi: { list: vi.fn().mockResolvedValue({ data: { documents: [] } }) },
}))

// Mock API
vi.mock('../../api/transactions.api', async () => {
  const actual = await vi.importActual<typeof import('../../api/transactions.api')>(
    '../../api/transactions.api'
  )
  return {
    ...actual,
    transactionsApi: { ...actual.transactionsApi, get: vi.fn() },
  }
})

const mockGet = vi.mocked(transactionsApi.get)

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

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
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
    createdAt: '2025-01-01T12:00:00.000Z',
    updatedAt: '2025-01-01T12:00:00.000Z',
    client: {
      id: 1,
      firstName: 'André',
      lastName: 'Côté',
      email: 'andre@example.com',
      phone: null,
      ownerUserId: 1,
      notes: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      provinceState: null,
      postalCode: null,
      homePhone: null,
      workPhone: null,
      cellPhone: null,
      createdAt: '2025-01-01T12:00:00.000Z',
      updatedAt: '2025-01-01T12:00:00.000Z',
    },
    transactionSteps: [makeStep()],
    conditions: [],
    ...overrides,
  }
}

function renderPage(route = '/transactions/1') {
  return renderWithProviders(
    <Routes>
      <Route path="/transactions/:id" element={<TransactionDetailPage />} />
    </Routes>,
    { initialRoute: route }
  )
}

beforeEach(() => {
  mockGet.mockReset()
})

describe('TransactionDetailPage', () => {
  it('shows loading spinner while data loads (AC1)', () => {
    mockGet.mockReturnValue(new Promise(() => {})) // never resolves
    renderPage()

    expect(screen.getByTestId('detail-loading')).toBeInTheDocument()
  })

  it('shows error state with retry button (AC2)', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))
    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('detail-error')).toBeInTheDocument()
    })

    // Retry button exists
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows not-found when API returns no transaction (AC3)', async () => {
    mockGet.mockResolvedValue({ success: true, data: { transaction: null } } as any)
    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('detail-not-found')).toBeInTheDocument()
    })
  })

  it('renders header and main sections when transaction loads (AC4)', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { transaction: makeTx() },
    } as any)
    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('transaction-detail-page')).toBeInTheDocument()
    })

    expect(screen.getByTestId('transaction-header')).toBeInTheDocument()
    expect(screen.getByTestId('vertical-timeline')).toBeInTheDocument()
  })

  it('renders property, parties, offers, and document sections (AC5)', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { transaction: makeTx() },
    } as any)
    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('transaction-detail-page')).toBeInTheDocument()
    })

    expect(screen.getByTestId('property-profile-card')).toBeInTheDocument()
    expect(screen.getByTestId('parties-card')).toBeInTheDocument()
    expect(screen.getByTestId('offers-panel')).toBeInTheDocument()
    expect(screen.getByTestId('document-status-bar')).toBeInTheDocument()
  })

  it('has data-testid on main container (AC6)', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { transaction: makeTx() },
    } as any)
    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('transaction-detail-page')).toBeInTheDocument()
    })
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    mockGet.mockResolvedValue({
      success: true,
      data: { transaction: makeTx() },
    } as any)
    const { container } = renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('transaction-detail-page')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
