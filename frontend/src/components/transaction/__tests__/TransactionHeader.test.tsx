import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import TransactionHeader from '../TransactionHeader'
import type { Transaction } from '../../../api/transactions.api'

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
    ...overrides,
  }
}

describe('TransactionHeader', () => {
  it('renders client full name (AC1)', () => {
    renderWithProviders(<TransactionHeader transaction={makeTx()} />)

    expect(screen.getByTestId('header-client')).toHaveTextContent('André Côté')
  })

  it('renders fallback when no client (AC2)', () => {
    renderWithProviders(
      <TransactionHeader transaction={makeTx({ client: undefined })} />
    )

    // Falls back to i18n key transaction.client
    expect(screen.getByTestId('header-client')).toBeInTheDocument()
    expect(screen.getByTestId('header-client').textContent).toBeTruthy()
  })

  it('renders property address when available (AC3)', () => {
    const tx = makeTx({
      property: { id: 1, address: '123 Rue Principale, Montréal' },
    })
    renderWithProviders(<TransactionHeader transaction={tx} />)

    expect(screen.getByTestId('header-address')).toHaveTextContent(
      '123 Rue Principale, Montréal'
    )
  })

  it('hides address when no property (AC4)', () => {
    renderWithProviders(<TransactionHeader transaction={makeTx()} />)

    expect(screen.queryByTestId('header-address')).not.toBeInTheDocument()
  })

  it('back link points to /transactions (AC5)', () => {
    renderWithProviders(<TransactionHeader transaction={makeTx()} />)

    const link = screen.getByTestId('back-link')
    expect(link).toHaveAttribute('href', '/transactions')
  })

  it('has required data-testid attributes (AC6)', () => {
    const tx = makeTx({
      property: { id: 1, address: '123 Rue Principale' },
    })
    renderWithProviders(<TransactionHeader transaction={tx} />)

    expect(screen.getByTestId('transaction-header')).toBeInTheDocument()
    expect(screen.getByTestId('back-link')).toBeInTheDocument()
    expect(screen.getByTestId('header-client')).toBeInTheDocument()
    expect(screen.getByTestId('header-address')).toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const tx = makeTx({
      property: { id: 1, address: '123 Rue Principale' },
    })
    const { container } = renderWithProviders(
      <TransactionHeader transaction={tx} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
