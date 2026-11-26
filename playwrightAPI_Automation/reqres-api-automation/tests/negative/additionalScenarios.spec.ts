import { test, expect } from '../../src/fixtures/apiFixture';
import { apiAssertions, timeRequest } from '../../src/utils/assertions';
import { ApiErrorResponse } from '../../src/types/reqres.types';
import invalid from '../../test-data/invalidData.json';

/**
 * Additional / cross-cutting scenarios:
 *  - Invalid endpoint
 *  - Missing / invalid request data
 *  - Response status-code validation
 *  - Response-time validation
 *  - Content-Type validation
 */
test.describe('Additional scenarios (negative & cross-cutting)', () => {
  test('invalid endpoint is rejected', async ({ apiClient }) => {
    const response = await apiClient.get(invalid.invalidEndpoint);
    // ReqRes quirk: unknown paths return 401 (not 404), even with a valid key.
    // We accept either so the test is robust to that behavior.
    apiAssertions.expectStatusOneOf(response, [401, 404]);
  });

  test('register with missing password returns 400 with an error message', async ({ authService }) => {
    const response = await authService.register(invalid.registerMissingPassword);

    apiAssertions.expectStatus(response, 400);
    const body = (await response.json()) as ApiErrorResponse;
    apiAssertions.expectNonEmptyString(body.error, 'error');
    expect(body.error).toContain('Missing password');
  });

  test('login with missing password returns 400', async ({ authService }) => {
    const response = await authService.login(invalid.loginMissingPassword);
    apiAssertions.expectStatus(response, 400);
    const body = (await response.json()) as ApiErrorResponse;
    expect(body.error).toBeDefined();
  });

  test('response time for a GET is within the limit', async ({ userService }) => {
    const { response, durationMs } = await timeRequest(() => userService.getUsers({ page: 1 }));
    apiAssertions.expectStatus(response, 200);
    apiAssertions.expectResponseTimeBelow(durationMs);
  });

  test('successful responses declare JSON content-type', async ({ userService }) => {
    const response = await userService.getSingleUser(1);
    apiAssertions.expectStatus(response, 200);
    apiAssertions.expectHeaderContains(response, 'content-type', 'application/json');
  });
});
