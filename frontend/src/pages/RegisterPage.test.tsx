import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../test/helpers'
import RegisterPage from './RegisterPage'

const mockRegister = vi.fn()

vi.mock('../api/auth.api', () => ({
  authApi: {
    register: (...args: unknown[]) => mockRegister(...args),
  },
}))

vi.mock('../components/OfraLogo', () => ({
  OfraLogo: () => <div data-testid="ofra-logo" />,
  OfraLogoFull: () => <div data-testid="ofra-logo-full" />,
}))

vi.mock('../components/ui/LanguageToggle', () => ({
  LanguageToggle: () => null,
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    mockRegister.mockReset()
  })

  it('renders registration form with submit button', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('vous@exemple.com')).toBeInTheDocument()
  })

  it('submit button is disabled when required fields are empty', () => {
    renderWithProviders(<RegisterPage />)
    const submitBtn = screen.getByRole('button', { name: /create account/i })
    expect(submitBtn).toBeDisabled()
  })

  it('submit button is disabled when passwords do not match', () => {
    renderWithProviders(<RegisterPage />)

    fireEvent.change(screen.getByPlaceholderText('Jean Dupont'), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByPlaceholderText('vous@exemple.com'), { target: { value: 'john@test.com' } })

    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } })
    fireEvent.change(passwordInputs[1], { target: { value: 'different123' } })

    const submitBtn = screen.getByRole('button', { name: /create account/i })
    expect(submitBtn).toBeDisabled()
  })

  it('submit button is disabled when password is too short', () => {
    renderWithProviders(<RegisterPage />)

    fireEvent.change(screen.getByPlaceholderText('Jean Dupont'), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByPlaceholderText('vous@exemple.com'), { target: { value: 'john@test.com' } })

    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(passwordInputs[0], { target: { value: 'short' } })
    fireEvent.change(passwordInputs[1], { target: { value: 'short' } })

    const submitBtn = screen.getByRole('button', { name: /create account/i })
    expect(submitBtn).toBeDisabled()
  })

  it('submit button enables and calls API with valid data', async () => {
    mockRegister.mockResolvedValue({ success: true })

    renderWithProviders(<RegisterPage />)

    fireEvent.change(screen.getByPlaceholderText('Jean Dupont'), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByPlaceholderText('vous@exemple.com'), { target: { value: 'john@test.com' } })

    const passwordInputs = screen.getAllByPlaceholderText('••••••••')
    fireEvent.change(passwordInputs[0], { target: { value: 'password123' } })
    fireEvent.change(passwordInputs[1], { target: { value: 'password123' } })

    const submitBtn = screen.getByRole('button', { name: /create account/i })
    expect(submitBtn).not.toBeDisabled()
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'John Doe',
          email: 'john@test.com',
          password: 'password123',
        }),
        expect.anything()
      )
    })
  })
})
