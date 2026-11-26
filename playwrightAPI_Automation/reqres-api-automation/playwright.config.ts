import { defineConfig } from '@playwright/test';
import { env } from './src/config/environment';

/**
 * playwright.config.ts
 * ---------------------
 * Central Playwright configuration for the API suite.
 *
 * Key points for API testing:
 *  - No browser project needed — these are pure HTTP tests.
 *  - `baseURL` + `extraHTTPHeaders` are set ONCE here, so every request made
 *    through the `request` fixture automatically uses the right host and the
 *    API key. Tests/clients never repeat this.
 *  - Reporters: list (console) + HTML (into reports/html-report). Allure is
 *    included and simply produces results if you choose to generate it.
 */
export default defineConfig({
  testDir: './tests',
  // Fail CI if a stray test.only is left behind.
  forbidOnly: !!process.env.CI,
  // Retry flaky network calls on CI only.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  fullyParallel: true,
  // Global expect timeout.
  timeout: env.timeout,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results', detail: true }],
  ],

  use: {
    baseURL: env.baseURL,
    // Default headers applied to EVERY request via the `request` fixture.
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      [env.apiKeyHeader]: env.apiKey,
    },
    // Keep a trace on first retry for debugging.
    trace: 'on-first-retry',
  },

  // A single logical project; no browser required for API tests.
  projects: [
    {
      name: 'api',
    },
  ],
});
