import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../test/helpers'
import LoginPage from './LoginPage'

const mockLogin = vi.fn()

vi.mock('../api/auth.api', () => ({
  authApi: {
    login: (...args: unknown[]) => mockLogin(...args),
  },
}))

vi.mock('../components/OfraLogo', () => ({
  OfraLogo: () => <div data-testid="ofra-logo" />,
  OfraLogoFull: () => <div data-testid="ofra-logo-full" />,
}))

vi.mock('../components/ui/LanguageToggle', () => ({
  LanguageToggle: () => null,
}))

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset()
  })

  it('renders login form with email and password fields', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByPlaceholderText(/exemple/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('submit button is disabled when fields are empty', () => {
    renderWithProviders(<LoginPage />)
    const submitBtn = screen.getByRole('button', { name: /sign in/i })
    expect(submitBtn).toBeDisabled()
  })

  it('has link to forgot password', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
  })

  it('has link to register', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText(/create an account/i)).toBeInTheDocument()
  })
})
