import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/helpers'
import ImportClientsModal from '../ImportClientsModal'
import { clientsApi } from '../../api/clients.api'

// Mock the API
vi.mock('../../api/clients.api', async () => {
  const actual = await vi.importActual<typeof import('../../api/clients.api')>('../../api/clients.api')
  return {
    ...actual,
    clientsApi: {
      ...actual.clientsApi,
      importCsv: vi.fn(),
      getImportTemplate: () => '/api/clients/import/template',
    },
  }
})

const mockImportCsv = vi.mocked(clientsApi.importCsv)

function createCsvFile(content: string, filename = 'test.csv'): File {
  return new File([content], filename, { type: 'text/csv' })
}

describe('ImportClientsModal', () => {
  beforeEach(() => {
    mockImportCsv.mockReset()
  })

  describe('Initial State', () => {
    it('renders modal with title and dropzone', () => {
      renderWithProviders(<ImportClientsModal isOpen={true} onClose={() => {}} />)

      expect(screen.getByText(/import clients/i)).toBeInTheDocument()
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
    })

    it('shows download template link', () => {
      renderWithProviders(<ImportClientsModal isOpen={true} onClose={() => {}} />)

      const link = screen.getByText(/download csv template/i)
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', '/api/clients/import/template')
    })

    it('renders file input', () => {
      renderWithProviders(<ImportClientsModal isOpen={true} onClose={() => {}} />)

      expect(screen.getByTestId('csv-file-input')).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('rejects non-CSV files', async () => {
      renderWithProviders(<ImportClientsModal isOpen={true} onClose={() => {}} />)

      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const input = screen.getByTestId('csv-file-input')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/import failed/i)).toBeInTheDocument()
      })
    })

    it('parses CSV and shows preview table', async () => {
      renderWithProviders(<ImportClientsModal isOpen={true} onClose={() => {}} />)

      const csvContent = 'firstName,lastName,email\nJohn,Doe,john@test.com\nJane,Smith,jane@test.com'
      const file = createCsvFile(csvContent)
      const input = screen.getByTestId('csv-file-input')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/preview/i)).toBeInTheDocument()
      })

      // Check table headers are displayed (in table header row)
      const table = document.querySelector('table')
      expect(table).toBeInTheDocument()
      expect(table?.textContent).toContain('firstName')
      expect(table?.textContent).toContain('lastName')
      expect(table?.textContent).toContain('email')

      // Check data rows are displayed
      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('Doe')).toBeInTheDocument()
    })

    it('shows column mapping badges for recognized columns', async () => {
      renderWithProviders(<ImportClientsModal isOpen={true} onClose={() => {}} />)

      const csvContent = 'firstName,lastName,unknownColumn\nJohn,Doe,value'
      const file = createCsvFile(csvContent)
      const input = screen.getByTestId('csv-file-input')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/preview/i)).toBeInTheDocument()
      })

      // Should show recognized columns count
      expect(screen.getByText(/2\/3 columns recognized/i)).toBeInTheDocument()
    })

    it('shows row count info', async () => {
      renderWithProviders(<ImportClientsModal isOpen={true} onClose={() => {}} />)

      const csvContent = 'firstName,lastName\nJohn,Doe\nJane,Smith\nBob,Wilson'
      const file = createCsvFile(csvContent)
      const input = screen.getByTestId('csv-file-input')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/3 rows total/i)).toBeInTheDocument()
      })
    })
  })

  describe('Import Flow', () => {
    it('calls API when import button is clicked', async () => {
      mockImportCsv.mockResolvedValue({
        success: true,
        data: { imported: 2, skipped: 0, errors: [] },
      })

      renderWithProviders(<ImportClientsModal isOpen={true} onClose={() => {}} />)

      const csvContent = 'firstName,lastName\nJohn,Doe\nJane,Smith'
      const file = createCsvFile(csvContent)
      const input = screen.getByTestId('csv-file-input')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('import-btn')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-btn'))

      await waitFor(() => {
        expect(mockImportCsv).toHaveBeenCalled()
      })
    })

    it('shows success state after successful import', async () => {
      mockImportCsv.mockResolvedValue({
        success: true,
        data: { imported: 2, skipped: 0, errors: [] },
      })

      renderWithProviders(<ImportClientsModal isOpen={true} onClose={() => {}} />)

      const csvContent = 'firstName,lastName\nJohn,Doe\nJane,Smith'
      const file = createCsvFile(csvContent)
      const input = screen.getByTestId('csv-file-input')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('import-btn')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-btn'))

      await waitFor(() => {
        expect(screen.getByText(/import successful/i)).toBeInTheDocument()
        expect(screen.getByText(/2 client\(s\) imported/i)).toBeInTheDocument()
      })
    })

    it('shows skipped count when some rows were skipped', async () => {
      mockImportCsv.mockResolvedValue({
        success: true,
        data: {
          imported: 2,
          skipped: 1,
          errors: [{ row: 3, message: 'Missing required field' }],
        },
      })

      renderWithProviders(<ImportClientsModal isOpen={true} onClose={() => {}} />)

      const csvContent = 'firstName,lastName\nJohn,Doe\nJane,Smith\n,Empty'
      const file = createCsvFile(csvContent)
      const input = screen.getByTestId('csv-file-input')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('import-btn')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-btn'))

      await waitFor(() => {
        expect(screen.getByText(/1 skipped/i)).toBeInTheDocument()
      })
    })

    it('shows error state when import fails completely', async () => {
      mockImportCsv.mockResolvedValue({
        success: false,
        data: {
          imported: 0,
          skipped: 2,
          errors: [{ row: 0, message: 'All rows failed' }],
        },
      })

      renderWithProviders(<ImportClientsModal isOpen={true} onClose={() => {}} />)

      const csvContent = 'firstName,lastName\n,\n,'
      const file = createCsvFile(csvContent)
      const input = screen.getByTestId('csv-file-input')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('import-btn')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-btn'))

      await waitFor(() => {
        expect(screen.getByText(/import failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('French Column Headers', () => {
    it('recognizes French column names', async () => {
      renderWithProviders(<ImportClientsModal isOpen={true} onClose={() => {}} />)

      const csvContent = 'prénom,nom,courriel\nJean,Dupont,jean@test.com'
      const file = createCsvFile(csvContent)
      const input = screen.getByTestId('csv-file-input')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/preview/i)).toBeInTheDocument()
      })

      // All 3 French columns should be recognized
      expect(screen.getByText(/3\/3 columns recognized/i)).toBeInTheDocument()
    })
  })

  describe('Reset and Close', () => {
    it('resets state when "Change file" is clicked', async () => {
      renderWithProviders(<ImportClientsModal isOpen={true} onClose={() => {}} />)

      const csvContent = 'firstName,lastName\nJohn,Doe'
      const file = createCsvFile(csvContent)
      const input = screen.getByTestId('csv-file-input')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/preview/i)).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText(/change file/i))

      await waitFor(() => {
        expect(screen.getByText(/drag and drop/i)).toBeInTheDocument()
      })
    })

    it('calls onClose when cancel is clicked', async () => {
      const onClose = vi.fn()
      renderWithProviders(<ImportClientsModal isOpen={true} onClose={onClose} />)

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onClose).toHaveBeenCalled()
    })
  })
})
