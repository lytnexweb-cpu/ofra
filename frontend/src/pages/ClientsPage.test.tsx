import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/helpers'
import ClientsPage from './ClientsPage'

const mockListClients = vi.fn()

vi.mock('../api/clients.api', () => ({
  clientsApi: {
    list: () => mockListClients(),
  },
}))

vi.mock('../components/CreateClientModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="create-client-modal" /> : null,
}))

vi.mock('../components/ImportClientsModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="import-clients-modal" /> : null,
}))

describe('ClientsPage', () => {
  beforeEach(() => {
    mockListClients.mockReset()
  })

  it('shows loading skeletons while fetching', () => {
    mockListClients.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<ClientsPage />)
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeTruthy()
  })

  it('shows empty state when no clients', async () => {
    mockListClients.mockResolvedValue({ success: true, data: { clients: [] } })
    renderWithProviders(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText(/no.*client|aucun/i)).toBeInTheDocument()
    })
  })

  it('renders client cards when data is available', async () => {
    mockListClients.mockResolvedValue({
      success: true,
      data: {
        clients: [
          { id: 1, firstName: 'John', lastName: 'Smith', email: 'john@test.com', phone: '555-1234' },
          { id: 2, firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com', phone: null },
        ],
      },
    })

    renderWithProviders(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText(/John/)).toBeInTheDocument()
      expect(screen.getByText(/Jane/)).toBeInTheDocument()
    })
  })
})
