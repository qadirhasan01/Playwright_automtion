import { test as base, APIRequestContext } from '@playwright/test';
import { ApiClient } from '../clients/apiClient';
import { UserService } from '../services/userService';
import { ResourceService } from '../services/resourceService';
import { AuthService } from '../services/authService';

/**
 * apiFixture.ts
 * --------------
 * Custom Playwright fixtures — the "dependency injection" of the framework.
 *
 * Instead of each test building its own client and services, they just ask
 * for `userService` / `resourceService` / `authService` in the test args and
 * Playwright constructs them, wired to the built-in `request` context (which
 * already carries baseURL + the API key from playwright.config.ts).
 *
 * Every spec imports { test, expect } from THIS file instead of
 * '@playwright/test'.
 */
type ApiFixtures = {
  apiClient: ApiClient;
  userService: UserService;
  resourceService: ResourceService;
  authService: AuthService;
};

export const test = base.extend<ApiFixtures>({
  apiClient: async ({ request }: { request: APIRequestContext }, use) => {
    await use(new ApiClient(request));
  },

  userService: async ({ apiClient }, use) => {
    await use(new UserService(apiClient));
  },

  resourceService: async ({ apiClient }, use) => {
    await use(new ResourceService(apiClient));
  },

  authService: async ({ apiClient }, use) => {
    await use(new AuthService(apiClient));
  },
});

// Re-export expect so specs have a single import source.
export { expect } from '@playwright/test';
