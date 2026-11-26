import { test, expect } from '../../src/fixtures/apiFixture';
import { apiAssertions, timeRequest } from '../../src/utils/assertions';
import { PaginatedResponse, SingleResponse, UserData } from '../../src/types/reqres.types';

/**
 * GET /users — list endpoint.
 * Covers: get all users, pagination, response time, content-type, and a
 * REQUEST-CORRELATION scenario (list -> pick an id -> fetch that single user).
 */
test.describe('GET /users (list)', () => {
  test('returns a paginated list of users [200]', async ({ userService }) => {
    const response = await userService.getUsers({ page: 1 });

    apiAssertions.expectStatus(response, 200);
    apiAssertions.expectSuccess(response);
    apiAssertions.expectJsonContentType(response);

    const body = (await response.json()) as PaginatedResponse<UserData>;

    // Pagination envelope contract.
    apiAssertions.expectHasFields(body, ['page', 'per_page', 'total', 'total_pages', 'data']);
    expect(body.page).toBe(1);
    expect(Array.isArray(body.data)).toBeTruthy();
    expect(body.data.length).toBe(body.per_page);

    // Each user matches the contract.
    for (const user of body.data) {
      apiAssertions.expectHasFields(user, ['id', 'email', 'first_name', 'last_name', 'avatar']);
      apiAssertions.expectFieldType(user, 'id', 'number');
      apiAssertions.expectValidEmail(user.email);
    }
  });

  test('supports pagination (page 2 differs from page 1)', async ({ userService }) => {
    const page1 = (await (await userService.getUsers({ page: 1 })).json()) as PaginatedResponse<UserData>;
    const page2 = (await (await userService.getUsers({ page: 2 })).json()) as PaginatedResponse<UserData>;

    expect(page2.page).toBe(2);
    // First user id on page 2 should not equal first user id on page 1.
    expect(page2.data[0]?.id).not.toBe(page1.data[0]?.id);
  });

  test('responds within the configured time limit', async ({ userService }) => {
    const { response, durationMs } = await timeRequest(() => userService.getUsers({ page: 1 }));
    apiAssertions.expectStatus(response, 200);
    apiAssertions.expectResponseTimeBelow(durationMs);
  });

  test('returns JSON content-type header', async ({ userService }) => {
    const response = await userService.getUsers();
    apiAssertions.expectHeaderContains(response, 'content-type', 'application/json');
  });

  // --- Request correlation: data from one call feeds the next ---
  test('correlation: list users, then fetch the first user by its id', async ({ userService }) => {
    const listResponse = await userService.getUsers({ page: 1 });
    const list = (await listResponse.json()) as PaginatedResponse<UserData>;
    const firstUser = list.data[0];
    expect(firstUser, 'list should contain at least one user').toBeDefined();

    // Correlate: use the id returned by the list call.
    const singleResponse = await userService.getSingleUser(firstUser.id);
    apiAssertions.expectStatus(singleResponse, 200);

    const single = (await singleResponse.json()) as SingleResponse<UserData>;
    expect(single.data.id).toBe(firstUser.id);
    expect(single.data.email).toBe(firstUser.email);
  });
});
