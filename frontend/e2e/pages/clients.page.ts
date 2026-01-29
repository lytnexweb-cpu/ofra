import { type Page, type Locator, expect } from '@playwright/test'

export class ClientsPage {
  readonly page: Page
  readonly heading: Locator
  readonly createButton: Locator
  readonly clientsList: Locator
  readonly emptyState: Locator
  readonly loadingSpinner: Locator

  // Create Client Modal
  readonly firstNameInput: Locator
  readonly lastNameInput: Locator
  readonly emailInput: Locator
  readonly phoneInput: Locator
  readonly submitButton: Locator
  readonly cancelButton: Locator
  readonly modalTitle: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Clients', exact: true })
    this.createButton = page.getByRole('button', { name: /new client/i }).first()
    this.clientsList = page.locator('ul').filter({ has: page.locator('li') })
    this.emptyState = page.getByText(/no clients yet/i)
    this.loadingSpinner = page.locator('.animate-spin')

    // Modal elements (using label selectors for form inputs)
    this.firstNameInput = page.getByLabel(/first name/i)
    this.lastNameInput = page.getByLabel(/last name/i)
    this.emailInput = page.getByLabel(/^email$/i)
    this.phoneInput = page.getByLabel(/^phone$/i)
    this.submitButton = page.getByRole('button', { name: /create client/i })
    this.cancelButton = page.getByRole('button', { name: /cancel/i })
    this.modalTitle = page.getByRole('heading', { name: /new client/i })
  }

  async goto() {
    await this.page.goto('/clients')
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible()
  }

  async openCreateModal() {
    await this.createButton.click()
    await expect(this.modalTitle).toBeVisible()
  }

  async createClient(client: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
  }) {
    await this.openCreateModal()

    await this.firstNameInput.fill(client.firstName)
    await this.lastNameInput.fill(client.lastName)

    if (client.email) {
      await this.emailInput.fill(client.email)
    }

    if (client.phone) {
      await this.phoneInput.fill(client.phone)
    }

    await this.submitButton.click()
  }

  async expectClientCreated(clientName: string) {
    // Modal should close
    await expect(this.modalTitle).not.toBeVisible({ timeout: 5000 })
    // Client should appear in list (use first() to avoid strict mode violation when name appears in multiple places)
    await expect(this.page.getByText(new RegExp(clientName, 'i')).first()).toBeVisible()
  }

  async clickClient(clientName: string) {
    await this.page.getByText(new RegExp(clientName, 'i')).click()
  }
}
