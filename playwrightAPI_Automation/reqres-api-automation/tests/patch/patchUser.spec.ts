import { test, expect } from '../../src/fixtures/apiFixture';
import { apiAssertions } from '../../src/utils/assertions';
import { UpdatedUserResponse } from '../../src/types/reqres.types';
import users from '../../test-data/users.json';

/**
 * PATCH /users/:id — partial update.
 * Contract: ReqRes echoes back ONLY the fields you sent, plus updatedAt.
 * So a name-only PATCH returns { name, updatedAt } with no job, and vice versa.
 */
test.describe('PATCH /users/:id (partial update)', () => {
  test('updates only the name [200]', async ({ userService }) => {
    const response = await userService.patchUser(2, users.patchName);

    apiAssertions.expectStatus(response, 200);
    const body = (await response.json()) as UpdatedUserResponse;

    expect(body.name).toBe(users.patchName.name);
    apiAssertions.expectRecentIsoTimestamp(body.updatedAt);
    // Only the requested field was echoed — job should be absent.
    expect(body.job).toBeUndefined();
  });

  test('updates only the job [200]', async ({ userService }) => {
    const response = await userService.patchUser(2, users.patchJob);

    apiAssertions.expectStatus(response, 200);
    const body = (await response.json()) as UpdatedUserResponse;

    expect(body.job).toBe(users.patchJob.job);
    apiAssertions.expectRecentIsoTimestamp(body.updatedAt);
    // Only the requested field was echoed — name should be absent.
    expect(body.name).toBeUndefined();
  });
});
