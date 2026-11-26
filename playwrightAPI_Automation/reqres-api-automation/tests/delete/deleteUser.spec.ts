import { test, expect } from '../../src/fixtures/apiFixture';
import { apiAssertions } from '../../src/utils/assertions';

/**
 * DELETE /users/:id.
 * Contract: ReqRes returns 204 No Content with an empty body.
 */
test.describe('DELETE /users/:id', () => {
  test('deletes a user and returns 204 No Content', async ({ userService }) => {
    const response = await userService.deleteUser(2);

    // Status-code contract.
    apiAssertions.expectStatus(response, 204);
    apiAssertions.expectSuccess(response); // 204 is still ok()

    // Response-body contract: 204 carries no body.
    const text = await response.text();
    expect(text).toBe('');
  });
});
