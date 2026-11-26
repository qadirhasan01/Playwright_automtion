import { APIResponse } from '@playwright/test';
import { ApiClient } from '../clients/apiClient';

/**
 * resourceService.ts
 * -------------------
 * Service layer for the ReqRes "resources" endpoints (/unknown).
 * Kept separate from UserService so each service maps to one resource —
 * a clean, single-responsibility split.
 */
export class ResourceService {
  private readonly resource = '/unknown';

  constructor(private readonly client: ApiClient) {}

  /** GET /unknown — list of resources. */
  getResources(): Promise<APIResponse> {
    return this.client.get(this.resource);
  }

  /** GET /unknown/:id — a single resource. */
  getSingleResource(id: number | string): Promise<APIResponse> {
    return this.client.get(`${this.resource}/${id}`);
  }
}
