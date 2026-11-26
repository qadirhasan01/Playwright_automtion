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
  // The ApiClient already backs off and retries on 429, so no test-level
  // retries are needed locally (they would just double-spend the rate limit).
  retries: process.env.CI ? 2 : 0,
  // Run serially by default: the public ReqRes "shared demo" key is rate
  // limited and bursts of parallel requests return 429. With your OWN free
  // key (https://app.reqres.in — 250 req/day) you can safely raise this,
  // e.g. `npx playwright test --workers=4`.
  workers: 1,
  fullyParallel: true,
  // Per-test timeout. Generous because the client may back off up to ~60s
  // when it hits the shared key's 20-requests-per-minute rate limit.
  timeout: 90_000,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results', detail: true }],
  ],

  use: {
    // NOTE: the base URL is applied by ApiClient (safe join that preserves the
    // "/api" path segment), not here — a leading-slash path under Playwright's
    // own `baseURL` would drop "/api". See src/clients/apiClient.ts.
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
