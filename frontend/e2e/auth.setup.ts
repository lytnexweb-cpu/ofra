/**
 * Auth setup - logs in once and saves state for other tests to reuse.
 * This avoids rate limiting issues from too many login attempts.
 */

import { test as setup, expect } from '@playwright/test'
import { TEST_USER } from './fixtures/test-data'

const authFile = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/login')

  // Fill in credentials (supports both EN and FR)
  const emailInput = page.getByRole('textbox', { name: /email|courriel/i })
  const passwordInput = page.getByRole('textbox', { name: /password|mot de passe/i })
  const submitButton = page.getByRole('button', { name: /sign in|se connecter/i })

  await emailInput.fill(TEST_USER.email)
  await passwordInput.fill(TEST_USER.password)
  await submitButton.click()

  // Wait for redirect to home page (dashboard at root)
  await expect(page).toHaveURL(/\/$|:\d+\/?$/)

  // Save signed-in state
  await page.context().storageState({ path: authFile })
})
