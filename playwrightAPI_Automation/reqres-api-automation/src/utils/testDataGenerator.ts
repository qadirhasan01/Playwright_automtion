import { UserPayload } from '../types/reqres.types';

/**
 * testDataGenerator.ts
 * ---------------------
 * Generates UNIQUE, dynamic test data at runtime.
 *
 * Why: re-running a suite with hardcoded data can cause collisions and
 * makes failures ambiguous. Unique names/emails make each run traceable.
 * No external faker dependency — just Node built-ins — to keep it light.
 */

const FIRST_NAMES = ['Neo', 'Trinity', 'Morpheus', 'Cypher', 'Dozer', 'Tank', 'Switch'];
const JOBS = ['QA Engineer', 'Automation Architect', 'Developer', 'Captain', 'Operator'];

/** Pick a random element from an array. */
function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** A short, collision-resistant token based on time + randomness. */
function uniqueToken(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Unique name, e.g. "Neo_lm3k9f2a". */
export function uniqueName(prefix = pick(FIRST_NAMES)): string {
  return `${prefix}_${uniqueToken()}`;
}

/** Unique, valid-looking email. */
export function uniqueEmail(domain = 'example.test'): string {
  return `user_${uniqueToken()}@${domain}`;
}

/** A complete, unique { name, job } payload for POST/PUT. */
export function generateUser(): UserPayload {
  return {
    name: uniqueName(),
    job: pick(JOBS),
  };
}

/** Generate N unique users (useful for data-driven tests). */
export function generateUsers(count: number): UserPayload[] {
  return Array.from({ length: count }, () => generateUser());
}
