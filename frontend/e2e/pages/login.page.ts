import { type Page, type Locator, expect } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    // Support both EN and FR: "Email address" / "Courriel"
    this.emailInput = page.getByRole('textbox', { name: /email|courriel/i })
    // Support both EN and FR: "Password" / "Mot de passe"
    this.passwordInput = page.getByRole('textbox', { name: /password|mot de passe/i })
    // Support both EN and FR: "Sign in" / "Se connecter"
    this.submitButton = page.getByRole('button', { name: /sign in|se connecter|signing in|connexion/i })
    // Error message container (visible when login fails)
    this.errorMessage = page.locator('[class*="bg-red"]')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    // Wait for form to be ready
    await this.emailInput.waitFor({ state: 'visible' })
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)

    // Click and wait for navigation or error
    await this.submitButton.click()

    // Wait a bit for the response
    await this.page.waitForTimeout(1000)
  }

  async expectLoginSuccess() {
    // Should redirect to root (dashboard) or transactions
    // Root URL ends with just the port or / (e.g., http://localhost:5174/ or http://localhost:5174)
    await expect(this.page).toHaveURL(/\/$|:\d+\/?$/)
  }

  async expectLoginError() {
    await expect(this.errorMessage).toBeVisible()
  }
}
