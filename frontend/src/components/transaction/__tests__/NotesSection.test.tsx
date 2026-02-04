import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithProviders } from '../../../test/helpers'
import NotesSection from '../NotesSection'
import type { Note } from '../../../api/notes.api'

const mockList = vi.fn()
const mockCreate = vi.fn()
const mockDelete = vi.fn()
const mockMe = vi.fn()

vi.mock('../../../api/notes.api', async () => {
  const actual = await vi.importActual('../../../api/notes.api')
  return {
    ...(actual as object),
    notesApi: {
      list: (...args: unknown[]) => mockList(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  }
})

vi.mock('../../../api/auth.api', async () => {
  const actual = await vi.importActual('../../../api/auth.api')
  return {
    ...(actual as object),
    authApi: {
      me: (...args: unknown[]) => mockMe(...args),
    },
  }
})

vi.mock('../../../hooks/use-toast', () => ({
  toast: vi.fn(),
}))

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 1,
    transactionId: 1,
    authorUserId: 10,
    content: 'Client called about financing',
    createdAt: '2026-01-25T12:00:00.000Z',
    updatedAt: '2026-01-25T12:00:00.000Z',
    author: { id: 10, fullName: 'André Côté', email: 'andre@example.com' },
    ...overrides,
  }
}

beforeEach(() => {
  mockList.mockReset().mockResolvedValue({
    success: true,
    data: { notes: [] },
  })
  mockCreate.mockReset().mockResolvedValue({ success: true })
  mockDelete.mockReset().mockResolvedValue({ success: true })
  mockMe.mockReset().mockResolvedValue({
    success: true,
    data: { user: { id: 10, email: 'andre@example.com', fullName: 'André Côté' } },
  })
})

describe('NotesSection', () => {
  it('shows empty state when no notes (AC1)', async () => {
    renderWithProviders(<NotesSection transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('notes-section')).toBeInTheDocument()
    })

    // Empty text visible (noResults i18n)
    expect(screen.getByTestId('notes-section').textContent).toBeTruthy()
  })

  it('renders notes list when notes exist (AC2)', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: {
        notes: [
          makeNote({ id: 1, content: 'First note' }),
          makeNote({ id: 2, content: 'Second note' }),
        ],
      },
    })

    renderWithProviders(<NotesSection transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('note-1')).toBeInTheDocument()
    })

    expect(screen.getByText('First note')).toBeInTheDocument()
    expect(screen.getByText('Second note')).toBeInTheDocument()
  })

  it('shows note author name (AC3)', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: {
        notes: [makeNote({ id: 1, author: { id: 10, fullName: 'Jean Tremblay', email: 'jean@test.com' } })],
      },
    })

    renderWithProviders(<NotesSection transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByText(/Jean Tremblay/)).toBeInTheDocument()
    })
  })

  it('has note input and submit button (AC4)', async () => {
    renderWithProviders(<NotesSection transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('note-input')).toBeInTheDocument()
    })

    expect(screen.getByTestId('note-submit')).toBeInTheDocument()
  })

  it('submit button is disabled when input empty (AC5)', async () => {
    renderWithProviders(<NotesSection transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('note-submit')).toBeInTheDocument()
    })

    expect(screen.getByTestId('note-submit')).toBeDisabled()
  })

  it('shows delete button for own notes (AC6)', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: { notes: [makeNote({ id: 5, authorUserId: 10 })] },
    })

    renderWithProviders(<NotesSection transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('note-5')).toBeInTheDocument()
    })

    expect(screen.getByTestId('delete-note-5')).toBeInTheDocument()
  })

  it('hides delete button for other users notes (AC7)', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: { notes: [makeNote({ id: 5, authorUserId: 99 })] },
    })

    renderWithProviders(<NotesSection transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('note-5')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('delete-note-5')).not.toBeInTheDocument()
  })

  it('has no WCAG 2.1 AA accessibility violations', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: { notes: [makeNote({ id: 1, authorUserId: 10 })] },
    })

    const { container } = renderWithProviders(<NotesSection transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('note-1')).toBeInTheDocument()
    })

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('NotesSection — resilience', () => {
  it('does not crash when list API rejects (network error)', async () => {
    mockList.mockRejectedValue(new Error('Network error'))

    renderWithProviders(<NotesSection transactionId={1} />)

    // Component should still render with input area
    await waitFor(() => {
      expect(screen.getByTestId('notes-section')).toBeInTheDocument()
    })
    expect(screen.getByTestId('note-input')).toBeInTheDocument()
  })

  it('shows error toast when create note fails', async () => {
    const { toast } = await import('../../../hooks/use-toast')
    mockCreate.mockRejectedValue(new Error('Server error'))

    renderWithProviders(<NotesSection transactionId={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('note-input')).toBeInTheDocument()
    })

    // Type and submit
    fireEvent.change(screen.getByTestId('note-input'), { target: { value: 'Test note' } })
    fireEvent.click(screen.getByTestId('note-submit'))

    await waitFor(() => {
      expect(toast).toHaveBeenCalled()
    })
  })
})
