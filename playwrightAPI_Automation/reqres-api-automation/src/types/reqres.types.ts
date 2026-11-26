/**
 * reqres.types.ts
 * ----------------
 * TypeScript interfaces describing the ReqRes API contract.
 *
 * Typing responses gives you autocompletion in tests and turns contract
 * drift into compile-time errors instead of runtime surprises.
 * These shapes were verified against the live API on 2026-11-26.
 */

/** A user object as returned in list/single endpoints. */
export interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

/** A resource object from the /unknown endpoints. */
export interface ResourceData {
  id: number;
  name: string;
  year: number;
  color: string;
  pantone_value: string;
}

/** Common pagination envelope used by list endpoints. */
export interface PaginatedResponse<T> {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: T[];
  support?: SupportInfo;
}

/** Single-item envelope: { data: {...} }. */
export interface SingleResponse<T> {
  data: T;
  support?: SupportInfo;
}

/** Promotional block ReqRes attaches to many responses. */
export interface SupportInfo {
  url: string;
  text: string;
  sponsored_by?: string;
}

/** Request body for POST / PUT /users. */
export interface UserPayload {
  name: string;
  job: string;
}

/**
 * POST /users response.
 * NOTE: `id` is returned as a STRING by ReqRes (e.g. "306"),
 * and `createdAt` is an ISO-8601 timestamp.
 */
export interface CreatedUserResponse {
  name: string;
  job: string;
  id: string;
  createdAt: string;
}

/** PUT / PATCH /users/:id response. Only echoed fields appear. */
export interface UpdatedUserResponse {
  name?: string;
  job?: string;
  updatedAt: string;
}

/** Request body for POST /register and /login. */
export interface AuthPayload {
  email: string;
  password?: string;
}

/** Successful register/login response. */
export interface AuthSuccessResponse {
  id?: number;
  token: string;
}

/** Error envelope, e.g. { error: "Missing password" }. */
export interface ApiErrorResponse {
  error: string;
}
