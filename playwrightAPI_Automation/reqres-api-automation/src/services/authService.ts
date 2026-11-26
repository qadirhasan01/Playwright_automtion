import { APIResponse } from '@playwright/test';
import { ApiClient } from '../clients/apiClient';
import { AuthPayload } from '../types/reqres.types';

/**
 * authService.ts
 * ---------------
 * Service layer for ReqRes auth endpoints. Used mainly by the negative
 * tests (e.g. register with a missing password returns 400).
 */
export class AuthService {
  constructor(private readonly client: ApiClient) {}

  /** POST /register — success needs email + password; missing pw => 400. */
  register(payload: AuthPayload): Promise<APIResponse> {
    return this.client.post('/register', { data: payload });
  }

  /** POST /login — success needs email + password. */
  login(payload: AuthPayload): Promise<APIResponse> {
    return this.client.post('/login', { data: payload });
  }
}
