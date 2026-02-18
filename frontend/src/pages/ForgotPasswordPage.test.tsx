import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../test/helpers'
import ForgotPasswordPage from './ForgotPasswordPage'

const mockForgotPassword = vi.fn()

vi.mock('../api/auth.api', () => ({
  authApi: {
    forgotPassword: (...args: unknown[]) => mockForgotPassword(...args),
  },
}))

vi.mock('../components/OfraLogo', () => ({
  OfraLogo: () => <div data-testid="ofra-logo" />,
  OfraLogoFull: () => <div data-testid="ofra-logo-full" />,
}))

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    mockForgotPassword.mockReset()
  })

  it('renders forgot password form', () => {
    renderWithProviders(<ForgotPasswordPage />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('submit button is disabled when email is empty', () => {
    renderWithProviders(<ForgotPasswordPage />)
    const submitBtn = screen.getByRole('button', { name: /send reset link/i })
    expect(submitBtn).toBeDisabled()
  })

  it('submit button enables when email is typed', () => {
    renderWithProviders(<ForgotPasswordPage />)
    const emailInput = screen.getByPlaceholderText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'john@test.com' } })

    const submitBtn = screen.getByRole('button', { name: /send reset link/i })
    expect(submitBtn).not.toBeDisabled()
  })

  it('calls forgotPassword API on valid submit', async () => {
    mockForgotPassword.mockResolvedValue({ success: true })

    renderWithProviders(<ForgotPasswordPage />)

    const emailInput = screen.getByPlaceholderText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'john@test.com' } })

    const submitBtn = screen.getByRole('button', { name: /send reset link/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith(
        { email: 'john@test.com' },
        expect.anything()
      )
    })
  })

  it('shows success message after submit', async () => {
    mockForgotPassword.mockResolvedValue({ success: true })

    renderWithProviders(<ForgotPasswordPage />)

    const emailInput = screen.getByPlaceholderText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'john@test.com' } })

    const submitBtn = screen.getByRole('button', { name: /send reset link/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    })
  })
})
