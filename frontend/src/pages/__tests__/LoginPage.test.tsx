import { describe, it, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../../test/helpers'
import LoginPage from '../LoginPage'

const renderLoginPage = () => {
  return renderWithProviders(<LoginPage />)
}

describe('LoginPage', () => {
  it('renders email and password inputs', () => {
    renderLoginPage()

    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    renderLoginPage()

    const button = screen.getByRole('button', { name: /sign in|login|log in|submit/i })
    expect(button).toBeInTheDocument()
  })

  it('allows typing in form fields', () => {
    renderLoginPage()

    const emailInput = screen.getByPlaceholderText(/email address/i) as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText(/password/i) as HTMLInputElement

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput.value).toBe('test@test.com')
    expect(passwordInput.value).toBe('password123')
  })
})
