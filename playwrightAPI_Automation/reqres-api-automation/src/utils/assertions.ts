import { APIResponse, expect } from '@playwright/test';
import { env } from '../config/environment';

/**
 * assertions.ts
 * --------------
 * Reusable, intention-revealing assertions built on Playwright `expect`.
 *
 * Tests read like sentences ("expect status 200", "expect JSON content type")
 * and validation logic lives in ONE place. Every helper throws a clear error
 * on failure, so the HTML report pinpoints the problem.
 */
export const apiAssertions = {
  /** Assert an exact HTTP status code. */
  expectStatus(response: APIResponse, expected: number): void {
    expect(
      response.status(),
      `Expected HTTP ${expected} but got ${response.status()} (${response.statusText()})`,
    ).toBe(expected);
  },

  /** Assert the status is one of several acceptable codes. */
  expectStatusOneOf(response: APIResponse, expected: number[]): void {
    expect(
      expected,
      `Expected status in [${expected.join(', ')}] but got ${response.status()}`,
    ).toContain(response.status());
  },

  /** Assert the response is in the 2xx success range. */
  expectSuccess(response: APIResponse): void {
    expect(response.ok(), `Expected a 2xx response, got ${response.status()}`).toBeTruthy();
  },

  /** Assert the Content-Type header is JSON. */
  expectJsonContentType(response: APIResponse): void {
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType, `Unexpected Content-Type: "${contentType}"`).toContain('application/json');
  },

  /** Assert a header exists (case-insensitive) and optionally contains a value. */
  expectHeaderContains(response: APIResponse, header: string, value: string): void {
    const actual = response.headers()[header.toLowerCase()] ?? '';
    expect(actual, `Header "${header}" = "${actual}" did not contain "${value}"`).toContain(value);
  },

  /** Assert the round-trip time is under the configured/explicit limit. */
  expectResponseTimeBelow(durationMs: number, maxMs: number = env.maxResponseTimeMs): void {
    expect(durationMs, `Response took ${durationMs}ms, limit is ${maxMs}ms`).toBeLessThan(maxMs);
  },

  /** Assert every field in the list is present (not undefined) on the object. */
  expectHasFields(obj: Record<string, unknown>, fields: string[]): void {
    for (const field of fields) {
      expect(obj[field], `Expected field "${field}" to be defined`).toBeDefined();
    }
  },

  /** Assert a field has the expected JavaScript type. */
  expectFieldType(
    obj: Record<string, unknown>,
    field: string,
    type: 'string' | 'number' | 'boolean' | 'object',
  ): void {
    expect(typeof obj[field], `Field "${field}" should be a ${type}`).toBe(type);
  },

  /** Assert a string looks like an email address. */
  expectValidEmail(value: unknown): void {
    expect(typeof value, 'email should be a string').toBe('string');
    expect(value as string, `"${value}" is not a valid email`).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  },

  /** Assert a value is a non-empty string. */
  expectNonEmptyString(value: unknown, label = 'value'): void {
    expect(typeof value, `${label} should be a string`).toBe('string');
    expect((value as string).length, `${label} should not be empty`).toBeGreaterThan(0);
  },

  /** Assert a string is a valid ISO-8601 timestamp that is recent (default: last 2 min). */
  expectRecentIsoTimestamp(value: unknown, withinMs = 120_000): void {
    expect(typeof value, 'timestamp should be a string').toBe('string');
    const time = Date.parse(value as string);
    expect(Number.isNaN(time), `"${value}" is not a valid ISO timestamp`).toBe(false);
    const age = Date.now() - time;
    expect(age, `Timestamp "${value}" is not recent (age ${age}ms)`).toBeLessThan(withinMs);
  },
};

/**
 * timeRequest
 * ------------
 * Runs an async request-producing function and reports how long it took.
 * Used by response-time tests:
 *   const { response, durationMs } = await timeRequest(() => userService.getUsers());
 */
export async function timeRequest<T>(fn: () => Promise<T>): Promise<{ response: T; durationMs: number }> {
  const start = Date.now();
  const response = await fn();
  return { response, durationMs: Date.now() - start };
}
