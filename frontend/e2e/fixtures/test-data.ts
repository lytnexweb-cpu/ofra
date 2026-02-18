/**
 * Test data for E2E tests.
 * Each test run uses unique emails to avoid conflicts.
 */

export function generateTestUser() {
  const timestamp = Date.now()
  return {
    email: `e2e-user-${timestamp}@test.com`,
    password: 'TestPassword123!',
    fullName: `E2E User ${timestamp}`,
  }
}

export const TEST_USER = {
  email: 'e2e-test@ofra.app',
  password: 'TestPassword123!',
  fullName: 'E2E Test User',
}

export const TEST_USER_B = {
  email: 'e2e-test-b@ofra.app',
  password: 'TestPassword123!',
  fullName: 'E2E Test User B',
}

export const TEST_CLIENT = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '506-555-1234',
}

export const TEST_TRANSACTION = {
  type: 'purchase' as const,
  salePrice: 350000,
}
