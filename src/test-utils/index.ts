/**
 * Test utilities for the caltrop-kaiju game
 */

import type { D4, DiceProvider } from "#game/types.ts";

/** Create a DiceProvider that returns values from a predetermined sequence (test-only) */
export const createSequenceDice = (sequence: readonly D4[]): DiceProvider => {
  let index = 0;
  return {
    rollD4: (): D4 => {
      if (index >= sequence.length) {
        throw new Error(
          `Dice sequence exhausted after ${sequence.length} rolls`,
        );
      }
      return sequence[index++]!;
    },
  };
};

/**
 * Create a mock Request object (defaults to localhost)
 */
export const mockRequest = (path: string, options: RequestInit = {}): Request => {
  const headers = new Headers(options.headers);
  headers.set("host", "localhost");
  return new Request(`http://localhost${path}`, { ...options, headers });
};

/**
 * Create a mock POST request with form data
 */
export const mockFormRequest = (
  path: string,
  data: Record<string, string>,
  cookie?: string,
): Request => {
  const body = new URLSearchParams(data).toString();
  const headers: HeadersInit = {
    "content-type": "application/x-www-form-urlencoded",
    host: "localhost",
  };
  if (cookie) {
    headers.cookie = cookie;
  }
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers,
    body,
  });
};

/**
 * Wait for a specified number of milliseconds
 */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate a random string of specified length
 */
export const randomString = (length: number): string => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
