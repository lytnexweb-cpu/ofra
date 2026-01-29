import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/login.page'
import { DashboardPage } from './pages/dashboard.page'
import { TEST_USER } from './fixtures/test-data'

test.describe('Authentication Flow', () => {
  // Clear cookies before each test to ensure fresh state
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('should login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)
    const dashboardPage = new DashboardPage(page)

    await loginPage.goto()
    await loginPage.login(TEST_USER.email, TEST_USER.password)
    await loginPage.expectLoginSuccess()

    // Verify we can see the dashboard
    await dashboardPage.expectLoaded()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await loginPage.goto()
    await loginPage.login('invalid@test.com', 'wrongpassword')
    await loginPage.expectLoginError()
  })

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Try to access protected route (dashboard is at root /)
    await page.goto('/')

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/)
  })

  test('should logout successfully', async ({ page }) => {
    const loginPage = new LoginPage(page)

    // First login
    await loginPage.goto()
    await loginPage.login(TEST_USER.email, TEST_USER.password)
    await loginPage.expectLoginSuccess()

    // Find and click logout button (usually in user dropdown)
    const userDropdown = page.getByRole('button', { name: /account|user|profile/i })
    if (await userDropdown.isVisible()) {
      await userDropdown.click()
    }

    const logoutButton = page.getByRole('button', { name: /logout|sign out|déconnexion/i })
    await logoutButton.click()

    // Should be back at login page
    await expect(page).toHaveURL(/\/login/)
  })
})
