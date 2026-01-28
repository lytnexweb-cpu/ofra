import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import DocumentsTab from '../DocumentsTab'
import type { Transaction } from '../../../api/transactions.api'
import type { Condition } from '../../../api/conditions.api'

function makeCondition(overrides: Partial<Condition> = {}): Condition {
  return {
    id: 1,
    transactionId: 1,
    transactionStepId: null,
    title: 'Financing Approval',
    description: null,
    status: 'pending',
    type: 'financing',
    priority: 'high',
    isBlocking: false,
    documentUrl: null,
    documentLabel: null,
    dueDate: '2026-02-01T12:00:00.000Z',
    completedAt: null,
    createdAt: '2025-01-01T12:00:00.000Z',
    updatedAt: '2025-01-01T12:00:00.000Z',
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
    currentStepId: null,
    organizationId: null,
    salePrice: null,
    notesText: null,
    listPrice: null,
    commission: null,
    folderUrl: null,
    createdAt: '2025-01-01T12:00:00.000Z',
    updatedAt: '2025-01-01T12:00:00.000Z',
    conditions: [],
    ...overrides,
  }
}

describe('DocumentsTab', () => {
  it('shows empty state when no documents exist (AC1)', () => {
    renderWithProviders(<DocumentsTab transaction={makeTx()} />)

    expect(screen.getByTestId('documents-empty')).toBeInTheDocument()
  })

  it('renders document links grouped by condition title (AC2)', () => {
    const tx = makeTx({
      conditions: [
        makeCondition({
          id: 1,
          title: 'Financing Letter',
          documentUrl: 'https://example.com/doc1.pdf',
          documentLabel: 'Bank Letter',
        }),
        makeCondition({
          id: 2,
          title: 'Inspection Report',
          documentUrl: 'https://example.com/doc2.pdf',
          documentLabel: 'Inspector Report',
        }),
      ],
    })
    renderWithProviders(<DocumentsTab transaction={tx} />)

    expect(screen.getByTestId('documents-tab')).toBeInTheDocument()
    expect(screen.getByText('Financing Letter')).toBeInTheDocument()
    expect(screen.getByText('Inspection Report')).toBeInTheDocument()
    expect(screen.getByText('Bank Letter')).toBeInTheDocument()
    expect(screen.getByText('Inspector Report')).toBeInTheDocument()
  })

  it('document links open in new tab with noopener (AC3)', () => {
    const tx = makeTx({
      conditions: [
        makeCondition({
          id: 1,
          documentUrl: 'https://example.com/doc.pdf',
          documentLabel: 'My Doc',
        }),
      ],
    })
    renderWithProviders(<DocumentsTab transaction={tx} />)

    const link = screen.getByTestId('document-link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('href', 'https://example.com/doc.pdf')
  })

  it('uses condition title as label fallback when no documentLabel', () => {
    const tx = makeTx({
      conditions: [
        makeCondition({
          id: 1,
          title: 'My Condition',
          documentUrl: 'https://example.com/doc.pdf',
          documentLabel: null,
        }),
      ],
    })
    renderWithProviders(<DocumentsTab transaction={tx} />)

    const links = screen.getAllByTestId('document-link')
    // label falls back to condition title
    expect(links[0].textContent).toContain('My Condition')
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const tx = makeTx({
      conditions: [
        makeCondition({
          id: 1,
          documentUrl: 'https://example.com/doc.pdf',
          documentLabel: 'My Doc',
        }),
      ],
    })
    const { container } = renderWithProviders(<DocumentsTab transaction={tx} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
