/**
 * Global setup for E2E tests.
 * Creates the test user with an organization if it doesn't exist.
 *
 * Note: If user exists without organization (legacy), you may need to
 * manually delete them from DB to recreate with organization:
 *   DELETE FROM users WHERE email = 'e2e-test@ofra.app';
 */

import { request } from '@playwright/test'
import { TEST_USER, TEST_USER_B } from './fixtures/test-data'

const API_BASE_URL = 'http://localhost:3333'

async function globalSetup() {
  console.log('🔧 E2E Global Setup: Creating test user with organization...')

  const apiContext = await request.newContext({
    baseURL: API_BASE_URL,
  })

  try {
    // Try to register the test user
    const registerResponse = await apiContext.post('/api/register', {
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password,
        fullName: TEST_USER.fullName,
      },
    })

    if (registerResponse.ok()) {
      console.log(`✅ Test user created with organization: ${TEST_USER.email}`)
    } else {
      const body = await registerResponse.json()
      // User might already exist
      if (body.error?.code === 'E_EMAIL_EXISTS' || registerResponse.status() === 409) {
        console.log(`ℹ️ Test user already exists: ${TEST_USER.email}`)
        console.log(`   (If tests fail with multi-tenant errors, delete user from DB and re-run)`)
      } else {
        console.log(`⚠️ Could not create test user: ${JSON.stringify(body)}`)
      }
    }
  } catch (error) {
    console.log(`⚠️ Registration request failed (backend may not be ready): ${error}`)
  }

  // Create second test user for tenant isolation tests
  try {
    const registerBResponse = await apiContext.post('/api/register', {
      data: {
        email: TEST_USER_B.email,
        password: TEST_USER_B.password,
        fullName: TEST_USER_B.fullName,
      },
    })

    if (registerBResponse.ok()) {
      console.log(`✅ Test user B created: ${TEST_USER_B.email}`)
    } else {
      const body = await registerBResponse.json()
      if (body.error?.code === 'E_EMAIL_EXISTS' || registerBResponse.status() === 409) {
        console.log(`ℹ️ Test user B already exists: ${TEST_USER_B.email}`)
      } else {
        console.log(`⚠️ Could not create test user B: ${JSON.stringify(body)}`)
      }
    }
  } catch (error) {
    console.log(`⚠️ Registration B request failed: ${error}`)
  }

  await apiContext.dispose()
}

export default globalSetup
