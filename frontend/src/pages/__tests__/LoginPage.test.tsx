import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from '../LoginPage'

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderLoginPage = () => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </QueryClientProvider>
  )
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
