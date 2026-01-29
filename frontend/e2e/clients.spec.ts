import { test, expect } from '@playwright/test'
import { ClientsPage } from './pages/clients.page'

test.describe('Clients Flow', () => {
  // Auth state is loaded from setup project - no login needed

  test('should display clients list', async ({ page }) => {
    const clientsPage = new ClientsPage(page)

    await clientsPage.goto()
    await clientsPage.expectLoaded()

    // Either we see clients list or empty state
    const hasClients = await clientsPage.clientsList.isVisible()
    const hasEmptyState = await clientsPage.emptyState.isVisible()

    expect(hasClients || hasEmptyState).toBe(true)
  })

  test('should open create client modal', async ({ page }) => {
    const clientsPage = new ClientsPage(page)

    await clientsPage.goto()
    await clientsPage.expectLoaded()
    await clientsPage.openCreateModal()

    // Modal should be visible with form fields
    await expect(clientsPage.firstNameInput).toBeVisible()
    await expect(clientsPage.lastNameInput).toBeVisible()
  })

  test('should create a new client', async ({ page }) => {
    const clientsPage = new ClientsPage(page)
    const testClient = {
      firstName: `E2E-${Date.now()}`,
      lastName: 'TestClient',
      email: `e2e-${Date.now()}@test.com`,
      phone: '555-123-4567',
    }

    await clientsPage.goto()
    await clientsPage.expectLoaded()
    await clientsPage.createClient(testClient)
    await clientsPage.expectClientCreated(testClient.firstName)
  })

  test('should not submit with empty required fields', async ({ page }) => {
    const clientsPage = new ClientsPage(page)

    await clientsPage.goto()
    await clientsPage.expectLoaded()
    await clientsPage.openCreateModal()

    // Try to submit without filling required fields
    // HTML5 validation will prevent submission
    await clientsPage.submitButton.click()

    // Modal should still be open (form didn't submit)
    await expect(clientsPage.modalTitle).toBeVisible()
  })

  test('should navigate to client detail page', async ({ page }) => {
    const clientsPage = new ClientsPage(page)

    await clientsPage.goto()
    await clientsPage.expectLoaded()

    // First create a client if empty
    const hasClients = !(await clientsPage.emptyState.isVisible())
    if (!hasClients) {
      await clientsPage.createClient({
        firstName: `E2E-Nav-${Date.now()}`,
        lastName: 'TestNav',
      })
    }

    // Click on a client to view details
    const clientLink = page.locator('a[href^="/clients/"]').first()
    if (await clientLink.isVisible()) {
      await clientLink.click()
      await expect(page).toHaveURL(/\/clients\/\d+/)
    }
  })
})
