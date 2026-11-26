import { test, expect } from '../../src/fixtures/apiFixture';
import { apiAssertions } from '../../src/utils/assertions';
import { SingleResponse, UserData } from '../../src/types/reqres.types';
import users from '../../test-data/users.json';
import invalid from '../../test-data/invalidData.json';

/**
 * GET /users/:id — single user + negative (non-existing) case.
 */
test.describe('GET /users/:id (single)', () => {
  test('returns a single user by id [200]', async ({ userService }) => {
    const response = await userService.getSingleUser(users.singleUser.id);

    apiAssertions.expectStatus(response, 200);
    apiAssertions.expectJsonContentType(response);

    const body = (await response.json()) as SingleResponse<UserData>;
    apiAssertions.expectHasFields(body.data, ['id', 'email', 'first_name', 'last_name', 'avatar']);
    expect(body.data.id).toBe(users.singleUser.id);
    expect(body.data.email).toBe(users.singleUser.email);
    expect(body.data.first_name).toBe(users.singleUser.first_name);
    apiAssertions.expectValidEmail(body.data.email);
  });

  // Data-driven across several valid ids.
  for (const id of [1, 2, 3]) {
    test(`returns a valid user for id=${id}`, async ({ userService }) => {
      const response = await userService.getSingleUser(id);
      apiAssertions.expectStatus(response, 200);
      const body = (await response.json()) as SingleResponse<UserData>;
      expect(body.data.id).toBe(id);
      apiAssertions.expectValidEmail(body.data.email);
    });
  }

  test('returns 404 with an empty body for a non-existing user', async ({ userService }) => {
    const response = await userService.getSingleUser(invalid.nonExistingUserId);

    apiAssertions.expectStatus(response, 404);
    // Contract: ReqRes returns an empty object {} for a missing user.
    const body = await response.json();
    expect(body).toEqual({});
  });
});
