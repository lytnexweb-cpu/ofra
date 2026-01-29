import { type Page, type Locator, expect } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly heading: Locator
  readonly activeTransactionsKPI: Locator
  readonly completedKPI: Locator
  readonly conversionRateKPI: Locator
  readonly overdueConditionsKPI: Locator
  readonly totalTransactions: Locator
  readonly pipelineChart: Locator
  readonly revenueChart: Locator
  readonly recentActivity: Locator
  readonly upcomingDeadlines: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /dashboard/i })
    this.activeTransactionsKPI = page.getByText(/active transactions/i)
    this.completedKPI = page.getByText(/completed/i).first()
    this.conversionRateKPI = page.getByText(/conversion rate/i)
    this.overdueConditionsKPI = page.getByText(/overdue conditions/i)
    this.totalTransactions = page.getByText(/total transactions/i)
    this.pipelineChart = page.locator('[data-testid="pipeline-chart"]')
    this.revenueChart = page.locator('[data-testid="revenue-chart"]')
    this.recentActivity = page.getByText(/recent activity/i)
    this.upcomingDeadlines = page.getByText(/upcoming deadlines/i)
  }

  async goto() {
    // Dashboard is at root /
    await this.page.goto('/')
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible()
  }

  async expectKPIsVisible() {
    await expect(this.activeTransactionsKPI).toBeVisible()
    await expect(this.completedKPI).toBeVisible()
  }
}
