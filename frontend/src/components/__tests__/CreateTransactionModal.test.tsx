import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../test/helpers'
import CreateTransactionModal from '../CreateTransactionModal'

// Mock matchMedia for useMediaQuery — simulate desktop
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(min-width: 640px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

// Mock APIs
const mockCreate = vi.fn()

vi.mock('../../api/clients.api', () => ({
  clientsApi: {
    list: vi.fn().mockResolvedValue({
      data: {
        clients: [
          { id: 1, firstName: 'Jean', lastName: 'Dupont' },
          { id: 2, firstName: 'Marie', lastName: 'Tremblay' },
        ],
      },
    }),
  },
}))

vi.mock('../../api/workflow-templates.api', () => ({
  workflowTemplatesApi: {
    list: vi.fn().mockResolvedValue({
      data: {
        templates: [
          { id: 10, name: 'NB Purchase', isDefault: true, slug: 'nb-purchase' },
          { id: 11, name: 'NB Sale', isDefault: false, slug: 'nb-sale' },
        ],
      },
    }),
  },
}))

vi.mock('../../api/transactions.api', async () => {
  const actual = await vi.importActual('../../api/transactions.api')
  return {
    ...(actual as object),
    transactionsApi: {
      ...(actual as any).transactionsApi,
      create: (...args: unknown[]) => mockCreate(...args),
    },
  }
})

vi.mock('../../hooks/use-toast', () => ({
  toast: vi.fn(),
}))

const noop = vi.fn()

beforeEach(() => {
  mockCreate.mockReset().mockResolvedValue({ success: true, data: { transaction: { id: 99 } } })
})

// --- Tests ---

describe('CreateTransactionModal', () => {
  it('renders form fields when open', async () => {
    renderWithProviders(<CreateTransactionModal isOpen={true} onClose={noop} />)

    // Wait for queries to resolve and form to render
    await waitFor(() => {
      expect(screen.getByTestId('create-form')).toBeInTheDocument()
    })

    expect(screen.getByTestId('client-select')).toBeInTheDocument()
    expect(screen.getByTestId('type-select')).toBeInTheDocument()
    expect(screen.getByTestId('template-select')).toBeInTheDocument()
    expect(screen.getByTestId('price-input')).toBeInTheDocument()
  })

  it('disables submit button until client is selected', async () => {
    renderWithProviders(<CreateTransactionModal isOpen={true} onClose={noop} />)

    await waitFor(() => {
      expect(screen.getByTestId('submit-create')).toBeInTheDocument()
    })

    // Submit should be disabled (clientId is 0 = not selected)
    expect(screen.getByTestId('submit-create')).toBeDisabled()
  })

  it('enables submit when client, template and profile are filled', async () => {
    renderWithProviders(<CreateTransactionModal isOpen={true} onClose={noop} />)

    await waitFor(() => {
      expect(screen.getByTestId('client-select')).toBeInTheDocument()
    })

    // Wait for templates to load and auto-select
    await waitFor(() => {
      const templateSelect = screen.getByTestId('template-select') as HTMLSelectElement
      expect(templateSelect.value).not.toBe('')
    })

    // Select a client
    fireEvent.change(screen.getByTestId('client-select'), { target: { value: '1' } })

    // Fill in required profile fields (D1: Conditions Engine)
    fireEvent.click(screen.getByTestId('property-type-house'))
    fireEvent.click(screen.getByTestId('property-context-urban'))
    fireEvent.click(screen.getByTestId('is-financed-true'))

    // Now submit should be enabled
    await waitFor(() => {
      expect(screen.getByTestId('submit-create')).not.toBeDisabled()
    })
  })

  it('calls transactionsApi.create on submit with correct payload', async () => {
    renderWithProviders(<CreateTransactionModal isOpen={true} onClose={noop} />)

    await waitFor(() => {
      expect(screen.getByTestId('client-select')).toBeInTheDocument()
    })

    // Wait for templates to load and auto-select
    await waitFor(() => {
      const templateSelect = screen.getByTestId('template-select') as HTMLSelectElement
      expect(templateSelect.value).not.toBe('')
    })

    // Select client
    fireEvent.change(screen.getByTestId('client-select'), { target: { value: '1' } })

    // Fill in required profile fields (D1: Conditions Engine)
    fireEvent.click(screen.getByTestId('property-type-house'))
    fireEvent.click(screen.getByTestId('property-context-urban'))
    fireEvent.click(screen.getByTestId('is-financed-true'))

    // Wait for submit to be enabled
    await waitFor(() => {
      expect(screen.getByTestId('submit-create')).not.toBeDisabled()
    })

    // Set price
    fireEvent.change(screen.getByTestId('price-input'), { target: { value: '350000' } })

    fireEvent.click(screen.getByTestId('submit-create'))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
    })

    // Verify the payload structure (salePrice is parsed as number)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 1,
        type: 'purchase',
        workflowTemplateId: 10,
        salePrice: 350000,
      })
    )
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    const { container } = renderWithProviders(
      <CreateTransactionModal isOpen={true} onClose={noop} />
    )

    await waitFor(() => {
      expect(screen.getByTestId('create-form')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
