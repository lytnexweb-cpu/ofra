import { type Page, type Locator, expect } from '@playwright/test'

export class TransactionsPage {
  readonly page: Page
  readonly heading: Locator
  readonly createButton: Locator
  readonly fabButton: Locator
  readonly searchInput: Locator
  readonly stepFilter: Locator
  readonly transactionsGrid: Locator
  readonly emptyState: Locator
  readonly skeleton: Locator
  readonly errorState: Locator

  // Create Transaction Modal
  readonly clientSelect: Locator
  readonly typeSelect: Locator
  readonly templateSelect: Locator
  readonly priceInput: Locator
  readonly submitCreateButton: Locator
  readonly cancelButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Transactions', exact: true })
    this.createButton = page.getByTestId('create-transaction-btn')
    this.fabButton = page.getByTestId('fab-create')
    this.searchInput = page.getByTestId('search-input')
    this.stepFilter = page.getByTestId('step-filter')
    this.transactionsGrid = page.getByTestId('transactions-grid')
    this.emptyState = page.getByText(/no transactions yet/i)
    this.skeleton = page.getByTestId('transactions-skeleton')
    this.errorState = page.getByTestId('transactions-error')

    // Modal elements
    this.clientSelect = page.getByTestId('client-select')
    this.typeSelect = page.getByTestId('type-select')
    this.templateSelect = page.getByTestId('template-select')
    this.priceInput = page.getByTestId('price-input')
    this.submitCreateButton = page.getByTestId('submit-create')
    this.cancelButton = page.getByRole('button', { name: /cancel|annuler/i })
  }

  async goto() {
    await this.page.goto('/transactions')
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible()
  }

  async waitForContent() {
    // Wait for skeleton to disappear, indicating content is loaded
    await expect(this.skeleton).not.toBeVisible({ timeout: 10000 })
    // Brief wait for state to settle
    await this.page.waitForTimeout(200)
  }

  async openCreateModal() {
    // Try desktop button first, then FAB for mobile
    const desktopBtn = this.createButton
    if (await desktopBtn.isVisible()) {
      await desktopBtn.click()
    } else {
      await this.fabButton.click()
    }
  }

  async createTransaction(options: {
    clientName: string
    type?: 'purchase' | 'sale'
    templateName?: string
    price?: string
  }) {
    await this.openCreateModal()

    // Select client by name (find option that contains the client name)
    const clientOptions = await this.clientSelect.locator('option').allTextContents()
    const matchingClient = clientOptions.find((opt) =>
      opt.toLowerCase().includes(options.clientName.toLowerCase())
    )
    if (matchingClient) {
      await this.clientSelect.selectOption({ label: matchingClient })
    }

    // Select type if specified
    if (options.type) {
      await this.typeSelect.selectOption(options.type)
    }

    // Template is usually auto-selected, but can override
    if (options.templateName) {
      const templateOptions = await this.templateSelect.locator('option').allTextContents()
      const matchingTemplate = templateOptions.find((opt) =>
        opt.toLowerCase().includes(options.templateName!.toLowerCase())
      )
      if (matchingTemplate) {
        await this.templateSelect.selectOption({ label: matchingTemplate })
      }
    }

    // Fill price if specified
    if (options.price) {
      await this.priceInput.fill(options.price)
    }

    // Submit
    await this.submitCreateButton.click()
  }

  async expectTransactionCreated() {
    // Wait for success toast to appear, confirming the transaction was created
    await expect(
      this.page.getByText(/success|succès/i).first()
    ).toBeVisible({ timeout: 10000 })
    // Close modal manually if still open (handles race condition)
    const closeBtn = this.page.getByRole('button', { name: /close|fermer/i })
    if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeBtn.click()
    }
  }

  async searchTransactions(query: string) {
    await this.searchInput.fill(query)
  }

  async filterByStep(step: string) {
    await this.stepFilter.selectOption(step)
  }

  async clickFirstTransaction() {
    const firstCard = this.page.locator('[data-testid^="transaction-card-"]').first()
    await firstCard.click()
  }
}
