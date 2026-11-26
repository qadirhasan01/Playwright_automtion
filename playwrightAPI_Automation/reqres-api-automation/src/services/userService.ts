import { APIResponse } from '@playwright/test';
import { ApiClient, QueryParams } from '../clients/apiClient';
import { UserPayload } from '../types/reqres.types';

/**
 * userService.ts
 * ---------------
 * The "service layer" for the /users resource.
 *
 * Tests should talk to this class, NOT to raw endpoints. If ReqRes ever
 * renames `/users` or changes query params, you fix it here once instead
 * of in every spec file. Each method returns the raw APIResponse so the
 * test stays in control of assertions.
 */
export class UserService {
  private readonly resource = '/users';

  constructor(private readonly client: ApiClient) {}

  /** GET /users — list of users (optionally paginated / with delay). */
  getUsers(query?: QueryParams): Promise<APIResponse> {
    return this.client.get(this.resource, { params: query });
  }

  /** GET /users/:id — a single user. */
  getSingleUser(id: number | string): Promise<APIResponse> {
    return this.client.get(`${this.resource}/${id}`);
  }

  /** POST /users — create a user (contract returns id + createdAt). */
  createUser(payload: UserPayload): Promise<APIResponse> {
    return this.client.post(this.resource, { data: payload });
  }

  /** PUT /users/:id — full update (contract returns updatedAt). */
  updateUser(id: number | string, payload: UserPayload): Promise<APIResponse> {
    return this.client.put(`${this.resource}/${id}`, { data: payload });
  }

  /** PATCH /users/:id — partial update (only sent fields are echoed). */
  patchUser(id: number | string, payload: Partial<UserPayload>): Promise<APIResponse> {
    return this.client.patch(`${this.resource}/${id}`, { data: payload });
  }

  /** DELETE /users/:id — contract returns 204 No Content. */
  deleteUser(id: number | string): Promise<APIResponse> {
    return this.client.delete(`${this.resource}/${id}`);
  }
}
