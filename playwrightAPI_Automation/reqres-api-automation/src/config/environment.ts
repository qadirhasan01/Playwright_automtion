import dotenv from 'dotenv';
import path from 'path';

/**
 * environment.ts
 * ---------------
 * Single source of truth for configuration.
 *
 * It loads the `.env` file (via dotenv) and exposes a typed, validated
 * `env` object so the rest of the framework never reads `process.env`
 * directly. This keeps secrets out of the code and makes it trivial to
 * point the suite at a different environment (staging, prod, a personal
 * ReqRes key, etc.) by changing one file.
 */

// Load variables from reqres-api-automation/.env into process.env.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface EnvConfig {
  /** API root, e.g. https://reqres.in/api */
  baseURL: string;
  /** API key value (optional for ReqRes, but supported). */
  apiKey: string;
  /** Header name the key is sent in, e.g. x-api-key. */
  apiKeyHeader: string;
  /** Per-request timeout in milliseconds. */
  timeout: number;
  /** Max acceptable response time for response-time assertions. */
  maxResponseTimeMs: number;
}

/** Small helper: read a numeric env var with a fallback. */
function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env: EnvConfig = {
  baseURL: process.env.BASE_URL?.trim() || 'https://reqres.in/api',
  apiKey: process.env.API_KEY?.trim() || 'reqres-free-v1',
  apiKeyHeader: process.env.API_KEY_HEADER?.trim() || 'x-api-key',
  timeout: num(process.env.API_TIMEOUT, 30_000),
  maxResponseTimeMs: num(process.env.MAX_RESPONSE_TIME_MS, 3_000),
};
