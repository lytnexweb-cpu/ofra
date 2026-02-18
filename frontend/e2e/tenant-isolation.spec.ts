import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/login.page'
import { ClientsPage } from './pages/clients.page'
import { TEST_USER, TEST_USER_B } from './fixtures/test-data'

/**
 * Tenant Isolation E2E Tests
 *
 * Verifies that data created by User A is NOT visible to User B.
 * Each user has their own organization and data is scoped accordingly.
 */
test.describe('Tenant Isolation', () => {
  const uniqueClientName = `IsolationTest-${Date.now()}`

  // Clear cookies before each test to allow fresh logins
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('User A creates a client that User B cannot see', async ({ page }) => {
    const loginPage = new LoginPage(page)
    const clientsPage = new ClientsPage(page)

    // --- Step 1: Login as User A and create a unique client ---
    await loginPage.goto()
    await loginPage.login(TEST_USER.email, TEST_USER.password)
    await loginPage.expectLoginSuccess()

    await clientsPage.goto()
    await clientsPage.expectLoaded()

    await clientsPage.createClient({
      firstName: uniqueClientName,
      lastName: 'UserA',
      email: `${uniqueClientName.toLowerCase()}@usera.com`,
    })
    await clientsPage.expectClientCreated(uniqueClientName)

    // Verify the client IS visible to User A
    await expect(page.getByText(uniqueClientName)).toBeVisible()

    // --- Step 2: Logout and login as User B ---
    await page.context().clearCookies()
    await loginPage.goto()
    await loginPage.login(TEST_USER_B.email, TEST_USER_B.password)
    await loginPage.expectLoginSuccess()

    // --- Step 3: Navigate to clients and verify isolation ---
    await clientsPage.goto()
    await clientsPage.expectLoaded()

    // Wait for the page to fully load (either clients list or empty state)
    await page.waitForTimeout(2000)

    // User B should NOT see User A's client
    const isolatedClient = page.getByText(uniqueClientName)
    await expect(isolatedClient).not.toBeVisible()
  })

  test('User B cannot access User A transaction by direct URL', async ({ page, request }) => {
    const loginPage = new LoginPage(page)

    // --- Step 1: Login as User A via API and get a transaction ID ---
    await loginPage.goto()
    await loginPage.login(TEST_USER.email, TEST_USER.password)
    await loginPage.expectLoginSuccess()

    // Navigate to transactions to get a transaction ID from the URL
    await page.goto('/transactions')
    await page.waitForTimeout(2000)

    // Try to find any transaction link
    const transactionLink = page.locator('a[href^="/transactions/"]').first()
    const hasTransaction = await transactionLink.isVisible()

    if (!hasTransaction) {
      // No transactions to test - skip gracefully
      test.skip()
      return
    }

    // Get the transaction URL
    const href = await transactionLink.getAttribute('href')
    const transactionUrl = href!

    // --- Step 2: Logout and login as User B ---
    await page.context().clearCookies()
    await loginPage.goto()
    await loginPage.login(TEST_USER_B.email, TEST_USER_B.password)
    await loginPage.expectLoginSuccess()

    // --- Step 3: Try to access User A's transaction directly ---
    await page.goto(transactionUrl)
    await page.waitForTimeout(2000)

    // Should see either a 404/error page or be redirected away
    // The page should NOT show the transaction details
    const errorOrRedirect =
      page.getByText(/not found|introuvable|forbidden|interdit|erreur|error/i)

    // Either we see an error message, or we got redirected to transactions list
    const isError = await errorOrRedirect.isVisible()
    const isRedirected = page.url().includes('/transactions') && !page.url().includes(transactionUrl)
    const isRootRedirect = /\/$|:\d+\/?$/.test(page.url())

    expect(isError || isRedirected || isRootRedirect).toBe(true)
  })

  test('API-level tenant isolation: User B gets empty list for User A data', async ({ page }) => {
    const loginPage = new LoginPage(page)

    // --- Login as User B ---
    await loginPage.goto()
    await loginPage.login(TEST_USER_B.email, TEST_USER_B.password)
    await loginPage.expectLoginSuccess()

    // --- Make API call for clients ---
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/clients', { credentials: 'include' })
      return res.json()
    })

    // User B should have their own (possibly empty) client list
    // but NOT see User A's clients
    expect(response.success).toBe(true)
    if (response.data?.clients) {
      const clientNames = response.data.clients.map((c: any) => `${c.firstName} ${c.lastName}`)
      // None of User B's clients should include User A's isolation test client
      for (const name of clientNames) {
        expect(name).not.toContain('IsolationTest')
      }
    }
  })
})
