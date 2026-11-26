import { test, expect } from '../../src/fixtures/apiFixture';
import { apiAssertions } from '../../src/utils/assertions';
import { UpdatedUserResponse } from '../../src/types/reqres.types';
import users from '../../test-data/users.json';

/**
 * PUT /users/:id — full update.
 * Contract: echoes { name, job, updatedAt }. No createdAt on update.
 */
test.describe('PUT /users/:id (full update)', () => {
  test('updates a user completely and returns updatedAt [200]', async ({ userService }) => {
    const response = await userService.updateUser(2, users.updateUser);

    apiAssertions.expectStatus(response, 200);
    apiAssertions.expectJsonContentType(response);

    const body = (await response.json()) as UpdatedUserResponse;

    // Updated fields are echoed back exactly.
    expect(body.name).toBe(users.updateUser.name);
    expect(body.job).toBe(users.updateUser.job);

    // updatedAt is present, valid and recent; createdAt must NOT appear.
    apiAssertions.expectRecentIsoTimestamp(body.updatedAt);
    expect((body as Record<string, unknown>).createdAt).toBeUndefined();
  });
});
