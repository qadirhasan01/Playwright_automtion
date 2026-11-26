import { APIRequestContext, APIResponse, test } from '@playwright/test';
import { env } from '../config/environment';

/**
 * apiClient.ts
 * -------------
 * A thin, reusable wrapper around Playwright's `APIRequestContext`.
 *
 * Why it exists:
 *  - One place for GET/POST/PUT/PATCH/DELETE logic (no duplication in tests).
 *  - Measures response time for every call.
 *  - Attaches a masked request/response log to the Playwright HTML report
 *    so every test is debuggable, WITHOUT leaking API keys or cookies.
 *
 * Base URL and default headers (including the API key) are configured once
 * in `playwright.config.ts` via `use.baseURL` and `use.extraHTTPHeaders`,
 * so this client only deals with per-request concerns.
 */

export type QueryParams = Record<string, string | number | boolean>;

export interface RequestOptions {
  /** Extra headers for this single request. */
  headers?: Record<string, string>;
  /** Query-string parameters. */
  params?: QueryParams;
  /** JSON request body (serialized automatically by Playwright). */
  data?: unknown;
}

/** The response plus how long the round-trip took. */
export interface TimedResponse {
  response: APIResponse;
  /** Round-trip duration in milliseconds. */
  durationMs: number;
}

/** Header names whose VALUES must never be written to the report. */
const SENSITIVE_HEADERS = ['authorization', 'x-api-key', 'api-key', 'cookie', 'set-cookie'];

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  /**
   * Safely join the base URL with an endpoint.
   *
   * We build the absolute URL ourselves instead of relying on Playwright's
   * `use.baseURL`, because a leading-slash path (e.g. "/users/2") resolves
   * against the ORIGIN under `new URL()` semantics and would DROP the
   * "/api" path segment (hitting reqres.in/users/2 -> 404). This keeps the
   * "/api" prefix no matter how the endpoint is written.
   */
  private buildUrl(endpoint: string): string {
    if (/^https?:\/\//i.test(endpoint)) return endpoint; // already absolute
    const base = env.baseURL.replace(/\/+$/, '');
    const path = endpoint.replace(/^\/+/, '');
    return `${base}/${path}`;
  }

  get(endpoint: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.send('get', endpoint, options);
  }

  post(endpoint: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.send('post', endpoint, options);
  }

  put(endpoint: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.send('put', endpoint, options);
  }

  patch(endpoint: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.send('patch', endpoint, options);
  }

  delete(endpoint: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.send('delete', endpoint, options);
  }

  /**
   * Same as the verb methods but also returns the measured duration.
   * Handy for response-time assertions.
   */
  async getTimed(endpoint: string, options: RequestOptions = {}): Promise<TimedResponse> {
    const start = Date.now();
    const response = await this.get(endpoint, options);
    return { response, durationMs: Date.now() - start };
  }

  /** Core dispatcher used by every verb. Centralizes timing + logging + errors + 429 backoff. */
  private async send(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions,
  ): Promise<APIResponse> {
    const url = this.buildUrl(endpoint);
    const maxAttempts = 4;

    for (let attempt = 1; ; attempt++) {
      const start = Date.now();
      let response: APIResponse;

      try {
        response = await this.request[method](url, {
          headers: options.headers,
          params: options.params,
          data: options.data,
        });
      } catch (error) {
        // Network / connection errors (DNS, timeout, refused) land here.
        await this.attach(`❌ ${method.toUpperCase()} ${endpoint} (request failed)`, {
          endpoint,
          method: method.toUpperCase(),
          params: options.params,
          requestBody: options.data,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }

      const durationMs = Date.now() - start;

      // ReqRes' shared demo key allows 20 requests / 60s. On a 429 we honor
      // the Ratelimit-Reset header, pause, and retry — so the suite paces
      // itself instead of failing on throttling.
      if (response.status() === 429 && attempt < maxAttempts) {
        const waitMs = this.rateLimitWaitMs(response);
        await this.attach(
          `⏳ 429 Too Many Requests on ${method.toUpperCase()} ${endpoint} — backing off ${waitMs}ms (attempt ${attempt}/${maxAttempts})`,
          { rateLimitHeaders: this.maskHeaders(response.headers()) },
        );
        await this.sleep(waitMs);
        continue;
      }

      await this.logExchange(method, endpoint, options, response, durationMs);
      return response;
    }
  }

  /** Decide how long to wait after a 429, from Ratelimit-Reset / Retry-After (seconds). */
  private rateLimitWaitMs(response: APIResponse): number {
    const headers = response.headers();
    const resetSec = Number(headers['ratelimit-reset'] ?? headers['retry-after']);
    const base = Number.isFinite(resetSec) && resetSec > 0 ? resetSec : 2;
    // Add a 1s buffer and cap at just over one window (60s).
    return Math.min((base + 1) * 1000, 65_000);
  }

  /** Promise-based sleep. */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Build a readable, masked log entry and attach it to the HTML report. */
  private async logExchange(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions,
    response: APIResponse,
    durationMs: number,
  ): Promise<void> {
    const rawBody = await response.text();

    const entry = {
      request: {
        method: method.toUpperCase(),
        endpoint,
        params: options.params ?? null,
        headers: this.maskHeaders(options.headers),
        body: options.data ?? null,
      },
      response: {
        status: response.status(),
        statusText: response.statusText(),
        ok: response.ok(),
        durationMs,
        headers: this.maskHeaders(response.headers()),
        body: this.safeJson(rawBody),
      },
    };

    const icon = response.ok() ? '✅' : '⚠️';
    await this.attach(`${icon} ${method.toUpperCase()} ${endpoint} → ${response.status()} (${durationMs}ms)`, entry);
  }

  /** Replace sensitive header values with a placeholder. */
  private maskHeaders(headers?: Record<string, string>): Record<string, string> {
    if (!headers) return {};
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      masked[key] = SENSITIVE_HEADERS.includes(key.toLowerCase()) ? '***MASKED***' : value;
    }
    return masked;
  }

  /** Parse JSON when possible; otherwise keep the raw text. */
  private safeJson(raw: string): unknown {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  /**
   * Attach to the current test's report entry.
   * Wrapped in try/catch because `test.info()` throws if called outside a
   * running test (keeps the client usable in any context).
   */
  private async attach(name: string, payload: unknown): Promise<void> {
    try {
      await test.info().attach(name, {
        body: JSON.stringify(payload, null, 2),
        contentType: 'application/json',
      });
    } catch {
      // Not inside a test runner context — safe to ignore.
    }
  }
}
