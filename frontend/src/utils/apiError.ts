import i18n from '../i18n'

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
  const t = (key: string) => i18n.t(key)

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
        title: t('common.sessionExpiredTitle'),
        message: t('common.sessionExpiredMessage'),
      }
    }

    // 422 - Validation errors
    if (response.status === 422 && response.data) {
      const data = response.data

      // Check for errors array or details
      if (data.error?.details) {
        return {
          title: t('common.validationErrorsTitle'),
          message: t('common.validationErrorsMessage'),
          fieldErrors: data.error.details,
        }
      }

      if (data.errors) {
        return {
          title: t('common.validationErrorsTitle'),
          message: t('common.validationErrorsMessage'),
          fieldErrors: data.errors,
        }
      }

      if (data.error?.message) {
        return {
          title: t('common.validationErrorTitle'),
          message: data.error.message,
        }
      }
    }

    // Other error responses
    if (response.data?.error?.message) {
      return {
        title: t('common.errorTitle'),
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
        title: t('common.networkErrorTitle'),
        message: t('common.networkErrorMessage'),
      }
    }
  }

  // Fallback
  return {
    title: t('common.unexpectedErrorTitle'),
    message: t('common.unexpectedErrorMessage'),
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
