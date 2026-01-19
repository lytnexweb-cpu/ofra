import type { ApiRequest } from '@japa/api-client'
import User from '#models/user'
import { cuid } from '@adonisjs/core/helpers'

/**
 * Helper interface for request with auth methods
 */
interface AuthenticatedRequest extends ApiRequest {
  withCookie(name: string, value: string): this
  withEncryptedCookie(name: string, value: unknown): this
}

/**
 * Authenticate a request as a specific user by injecting session cookies.
 * This creates a session directly without going through the login flow.
 *
 * Usage: await client.get('/api/me').use(authenticateAs(user))
 */
export function authenticateAs(user: User) {
  return (request: AuthenticatedRequest) => {
    const sessionId = cuid()
    const sessionData = { auth_web: user.id }

    request.withCookie('adonis-session', sessionId)
    request.withEncryptedCookie(sessionId, sessionData)

    return request
  }
}

/**
 * Helper to create a user for testing
 */
export async function createTestUser(
  overrides: { email?: string; password?: string; fullName?: string } = {}
): Promise<User> {
  const { createUser } = await import('./factories/user.js')
  return createUser(overrides)
}
