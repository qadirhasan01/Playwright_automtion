import { test, expect } from '../../src/fixtures/apiFixture';
import { apiAssertions } from '../../src/utils/assertions';
import { PaginatedResponse, ResourceData, SingleResponse } from '../../src/types/reqres.types';
import invalid from '../../test-data/invalidData.json';

/**
 * GET /unknown — the ReqRes "resources" endpoints.
 * Covers: list, single, and non-existing resource.
 */
test.describe('GET /unknown (resources)', () => {
  test('returns a list of resources [200]', async ({ resourceService }) => {
    const response = await resourceService.getResources();

    apiAssertions.expectStatus(response, 200);
    apiAssertions.expectJsonContentType(response);

    const body = (await response.json()) as PaginatedResponse<ResourceData>;
    apiAssertions.expectHasFields(body, ['page', 'per_page', 'total', 'total_pages', 'data']);
    expect(body.data.length).toBeGreaterThan(0);

    for (const resource of body.data) {
      apiAssertions.expectHasFields(resource, ['id', 'name', 'year', 'color', 'pantone_value']);
      apiAssertions.expectFieldType(resource, 'year', 'number');
    }
  });

  test('returns a single resource by id [200]', async ({ resourceService }) => {
    const response = await resourceService.getSingleResource(2);

    apiAssertions.expectStatus(response, 200);
    const body = (await response.json()) as SingleResponse<ResourceData>;
    expect(body.data.id).toBe(2);
    apiAssertions.expectHasFields(body.data, ['name', 'year', 'color', 'pantone_value']);
  });

  test('returns 404 for a non-existing resource', async ({ resourceService }) => {
    const response = await resourceService.getSingleResource(invalid.nonExistingResourceId);
    apiAssertions.expectStatus(response, 404);
    expect(await response.json()).toEqual({});
  });
});
