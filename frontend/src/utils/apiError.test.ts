import { describe, it, expect } from 'vitest'
import { parseApiError, isSessionExpired } from './apiError'

describe('parseApiError', () => {
  it('handles 401 session expired', () => {
    const error = { response: { status: 401 } }
    const result = parseApiError(error)
    expect(result.title).toBe('Session expirée')
    expect(result.message).toContain('reconnecter')
  })

  it('handles 419 session expired', () => {
    const error = { response: { status: 419 } }
    const result = parseApiError(error)
    expect(result.title).toBe('Session expirée')
  })

  it('handles 422 validation with error.details', () => {
    const error = {
      response: {
        status: 422,
        data: {
          error: {
            details: { email: ['Email is required'] },
          },
        },
      },
    }
    const result = parseApiError(error)
    expect(result.title).toBe('Erreurs de validation')
    expect(result.fieldErrors).toEqual({ email: ['Email is required'] })
  })

  it('handles 422 validation with data.errors', () => {
    const error = {
      response: {
        status: 422,
        data: {
          errors: { name: ['Name too short'] },
        },
      },
    }
    const result = parseApiError(error)
    expect(result.title).toBe('Erreurs de validation')
    expect(result.fieldErrors).toEqual({ name: ['Name too short'] })
  })

  it('handles 422 validation with error.message', () => {
    const error = {
      response: {
        status: 422,
        data: {
          error: { message: 'Validation failed' },
        },
      },
    }
    const result = parseApiError(error)
    expect(result.title).toBe('Erreur de validation')
    expect(result.message).toBe('Validation failed')
  })

  it('handles generic error responses', () => {
    const error = {
      response: {
        status: 500,
        data: {
          error: { message: 'Internal server error' },
        },
      },
    }
    const result = parseApiError(error)
    expect(result.title).toBe('Erreur')
    expect(result.message).toBe('Internal server error')
  })

  it('handles network errors', () => {
    const error = { message: 'Network Error' }
    const result = parseApiError(error)
    expect(result.title).toBe('Erreur réseau')
    expect(result.message).toContain('serveur')
  })

  it('handles fetch errors', () => {
    const error = { message: 'Failed to fetch' }
    const result = parseApiError(error)
    expect(result.title).toBe('Erreur réseau')
  })

  it('returns fallback for unknown errors', () => {
    const result = parseApiError('something weird')
    expect(result.title).toBe('Erreur inattendue')
  })

  it('returns fallback for null', () => {
    const result = parseApiError(null)
    expect(result.title).toBe('Erreur inattendue')
  })
})

describe('isSessionExpired', () => {
  it('returns true for 401', () => {
    expect(isSessionExpired({ response: { status: 401 } })).toBe(true)
  })

  it('returns true for 419', () => {
    expect(isSessionExpired({ response: { status: 419 } })).toBe(true)
  })

  it('returns false for 200', () => {
    expect(isSessionExpired({ response: { status: 200 } })).toBe(false)
  })

  it('returns false for non-response errors', () => {
    expect(isSessionExpired({ message: 'Network error' })).toBe(false)
  })

  it('returns false for null', () => {
    expect(isSessionExpired(null)).toBe(false)
  })
})
