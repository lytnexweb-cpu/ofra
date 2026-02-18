import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test/helpers'
import VerifyEmailPage from './VerifyEmailPage'

const mockHttpGet = vi.fn()

vi.mock('../api/http', () => ({
  http: {
    get: (...args: unknown[]) => mockHttpGet(...args),
  },
}))

vi.mock('../components/OfraLogo', () => ({
  OfraLogo: () => <div data-testid="ofra-logo" />,
  OfraLogoFull: () => <div data-testid="ofra-logo-full" />,
}))

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    mockHttpGet.mockReset()
  })

  it('shows check-email message when no token in URL', () => {
    renderWithProviders(<VerifyEmailPage />, { initialRoute: '/verify-email' })
    expect(screen.getByText(/check your email/i)).toBeInTheDocument()
  })

  it('shows loading state while verifying token', () => {
    mockHttpGet.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<VerifyEmailPage />, { initialRoute: '/verify-email?token=abc123' })
    expect(screen.getByText(/verif/i)).toBeInTheDocument()
  })

  it('shows success after successful verification', async () => {
    mockHttpGet.mockResolvedValue({ success: true })
    renderWithProviders(<VerifyEmailPage />, { initialRoute: '/verify-email?token=valid-token' })

    await waitFor(() => {
      expect(screen.getByText(/email confirmed/i)).toBeInTheDocument()
    })
  })

  it('shows error for invalid/expired token', async () => {
    mockHttpGet.mockRejectedValue(new Error('Invalid token'))
    renderWithProviders(<VerifyEmailPage />, { initialRoute: '/verify-email?token=bad-token' })

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument()
    })
  })
})
