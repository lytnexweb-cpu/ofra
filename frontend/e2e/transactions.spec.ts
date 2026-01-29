import { test, expect } from '@playwright/test'
import { TransactionsPage } from './pages/transactions.page'
import { ClientsPage } from './pages/clients.page'
import { TEST_CLIENT, TEST_TRANSACTION } from './fixtures/test-data'

test.describe('Transactions Flow', () => {
  // Auth state is loaded from setup project - no login needed

  test('should display transactions list', async ({ page }) => {
    const transactionsPage = new TransactionsPage(page)

    await transactionsPage.goto()
    await transactionsPage.expectLoaded()
    await transactionsPage.waitForContent()

    // Either we see transactions grid or empty state
    const hasTransactions = await transactionsPage.transactionsGrid.isVisible()
    const hasEmptyState = await transactionsPage.emptyState.isVisible()

    expect(hasTransactions || hasEmptyState).toBe(true)
  })

  test('should open create transaction modal', async ({ page }) => {
    const transactionsPage = new TransactionsPage(page)

    await transactionsPage.goto()
    await transactionsPage.expectLoaded()
    await transactionsPage.openCreateModal()

    // Modal should be visible
    await expect(transactionsPage.clientSelect).toBeVisible()
    await expect(transactionsPage.typeSelect).toBeVisible()
  })

  test('should create a transaction with existing client', async ({ page }) => {
    const clientsPage = new ClientsPage(page)
    const transactionsPage = new TransactionsPage(page)

    // First ensure we have a client
    await clientsPage.goto()
    await clientsPage.expectLoaded()

    // Check if we need to create a client first
    const hasClients = !(await clientsPage.emptyState.isVisible())
    if (!hasClients) {
      await clientsPage.createClient({
        firstName: TEST_CLIENT.firstName,
        lastName: TEST_CLIENT.lastName,
        email: TEST_CLIENT.email,
      })
      await clientsPage.expectClientCreated(TEST_CLIENT.firstName)
    }

    // Now create a transaction
    await transactionsPage.goto()
    await transactionsPage.expectLoaded()
    await transactionsPage.createTransaction({
      clientName: TEST_CLIENT.firstName,
      type: TEST_TRANSACTION.type,
      price: TEST_TRANSACTION.salePrice.toString(),
    })

    await transactionsPage.expectTransactionCreated()
  })

  test('should filter transactions by step', async ({ page }) => {
    const transactionsPage = new TransactionsPage(page)

    await transactionsPage.goto()
    await transactionsPage.expectLoaded()
    await transactionsPage.waitForContent()

    // Only test filtering if there are transactions
    const hasTransactions = await transactionsPage.transactionsGrid.isVisible()
    if (hasTransactions) {
      // Filter by consultation step
      await transactionsPage.filterByStep('consultation')

      // Filter bar should be visible
      await expect(transactionsPage.stepFilter).toHaveValue('consultation')
    }
  })

  test('should search transactions', async ({ page }) => {
    const transactionsPage = new TransactionsPage(page)

    await transactionsPage.goto()
    await transactionsPage.expectLoaded()
    await transactionsPage.waitForContent()

    // Only test search if there are transactions
    const hasTransactions = await transactionsPage.transactionsGrid.isVisible()
    if (hasTransactions) {
      await transactionsPage.searchTransactions(TEST_CLIENT.firstName)

      // Search input should have value
      await expect(transactionsPage.searchInput).toHaveValue(TEST_CLIENT.firstName)
    }
  })

  test('should navigate to transaction detail', async ({ page }) => {
    const transactionsPage = new TransactionsPage(page)

    await transactionsPage.goto()
    await transactionsPage.expectLoaded()
    await transactionsPage.waitForContent()

    // Only test if there are transactions
    const hasTransactions = await transactionsPage.transactionsGrid.isVisible()
    if (hasTransactions) {
      await transactionsPage.clickFirstTransaction()

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/transactions\/\d+/)
    }
  })
})
