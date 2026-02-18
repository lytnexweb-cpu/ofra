import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Ofra CRM E2E tests.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,
  globalSetup: './e2e/global-setup.ts',

  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // Setup project - authenticates and saves state
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Auth tests run without saved state (they test login flow)
    {
      name: 'auth-tests',
      testMatch: /auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Tenant isolation tests manage their own auth (login/logout per user)
    {
      name: 'tenant-isolation',
      testMatch: /tenant-isolation\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Other tests depend on setup and use saved auth state
    {
      name: 'chromium',
      testIgnore: /auth\.(setup|spec)\.ts|tenant-isolation\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
    },
  ],

  /* Run local dev server before starting tests */
  webServer: [
    {
      command: 'cd ../backend && npm run dev',
      url: 'http://localhost:3333/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5174',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
})
