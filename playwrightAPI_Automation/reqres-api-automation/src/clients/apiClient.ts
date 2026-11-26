import { APIRequestContext, APIResponse, test } from '@playwright/test';

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

  /** Core dispatcher used by every verb. Centralizes timing + logging + errors. */
  private async send(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions,
  ): Promise<APIResponse> {
    const start = Date.now();
    let response: APIResponse;

    try {
      response = await this.request[method](endpoint, {
        headers: options.headers,
        params: options.params,
        data: options.data,
      });
    } catch (error) {
      // Network / connection errors (DNS, timeout, refused) land here.
      await this.attach(
        `❌ ${method.toUpperCase()} ${endpoint} (request failed)`,
        {
          endpoint,
          method: method.toUpperCase(),
          params: options.params,
          requestBody: options.data,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      throw error;
    }

    const durationMs = Date.now() - start;
    await this.logExchange(method, endpoint, options, response, durationMs);
    return response;
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
