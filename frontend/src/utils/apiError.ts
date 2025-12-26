export interface ParsedError {
  title: string
  message: string
  fieldErrors?: Record<string, string[]>
}

/**
 * Parse API errors into user-friendly messages
 * Handles: 401/419 (session), validation errors, network errors
 */
export function parseApiError(error: unknown): ParsedError {
  // Type guard for error with response
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object'
  ) {
    const response = error.response as any

    // 401/419 - Session expired
    if (response.status === 401 || response.status === 419) {
      return {
        title: 'Session expirée',
        message:
          'Votre session a expiré. Merci de vous reconnecter pour continuer.',
      }
    }

    // 422 - Validation errors
    if (response.status === 422 && response.data) {
      const data = response.data

      // Check for errors array or details
      if (data.error?.details) {
        return {
          title: 'Erreurs de validation',
          message: 'Veuillez corriger les erreurs ci-dessous.',
          fieldErrors: data.error.details,
        }
      }

      if (data.errors) {
        return {
          title: 'Erreurs de validation',
          message: 'Veuillez corriger les erreurs ci-dessous.',
          fieldErrors: data.errors,
        }
      }

      if (data.error?.message) {
        return {
          title: 'Erreur de validation',
          message: data.error.message,
        }
      }
    }

    // Other error responses
    if (response.data?.error?.message) {
      return {
        title: 'Erreur',
        message: response.data.error.message,
      }
    }
  }

  // Network error (no response)
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    const message = error.message.toLowerCase()
    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Erreur réseau',
        message:
          'Impossible de joindre le serveur. Vérifie que le backend tourne (port 3333).',
      }
    }
  }

  // Fallback
  return {
    title: 'Erreur inattendue',
    message: 'Une erreur est survenue. Veuillez réessayer.',
  }
}

/**
 * Check if error is session expiration (401/419)
 */
export function isSessionExpired(error: unknown): boolean {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object'
  ) {
    const response = error.response as any
    return response.status === 401 || response.status === 419
  }
  return false
}
