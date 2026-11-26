import { test, expect } from '../../src/fixtures/apiFixture';
import { apiAssertions } from '../../src/utils/assertions';
import { CreatedUserResponse } from '../../src/types/reqres.types';
import { generateUser } from '../../src/utils/testDataGenerator';
import users from '../../test-data/users.json';

/**
 * POST /users — create a user.
 *
 * CONTRACT vs PERSISTENCE:
 * ReqRes is a demo API. It ECHOES the payload back with a generated `id`
 * and `createdAt`, but it does NOT persist the record (the response even
 * carries `_meta.persisted: false`). These tests validate the response
 * CONTRACT only — not that a row was saved in a database.
 */
test.describe('POST /users (create)', () => {
  test('creates a user and returns id + createdAt [201]', async ({ userService }) => {
    const payload = generateUser();
    const response = await userService.createUser(payload);

    apiAssertions.expectStatus(response, 201);
    apiAssertions.expectJsonContentType(response);

    const body = (await response.json()) as CreatedUserResponse;

    // Echoed fields match what we sent.
    expect(body.name).toBe(payload.name);
    expect(body.job).toBe(payload.job);

    // Server-generated fields exist and are well-formed.
    apiAssertions.expectHasFields(body, ['id', 'createdAt']);
    apiAssertions.expectNonEmptyString(body.id, 'id'); // NOTE: ReqRes returns id as a STRING
    apiAssertions.expectRecentIsoTimestamp(body.createdAt);
  });

  // Data-driven: multiple test-data combinations from users.json.
  for (const payload of users.createUsers) {
    test(`creates a user with data: ${payload.name}`, async ({ userService }) => {
      const response = await userService.createUser(payload);

      apiAssertions.expectStatus(response, 201);
      const body = (await response.json()) as CreatedUserResponse;

      expect(body.name).toBe(payload.name);
      expect(body.job).toBe(payload.job);
      apiAssertions.expectNonEmptyString(body.id, 'id');
      apiAssertions.expectRecentIsoTimestamp(body.createdAt);
    });
  }

  test('correlation: created id can be captured for a follow-up step', async ({ userService }) => {
    const payload = generateUser();
    const created = (await (await userService.createUser(payload)).json()) as CreatedUserResponse;

    // The generated id is available to correlate into later requests.
    expect(created.id).toBeDefined();
    // (ReqRes does not persist, so a GET on this id would 404 — we assert the
    //  contract, i.e. that an id was generated, not that it is retrievable.)
    expect(Number(created.id)).toBeGreaterThan(0);
  });
});
