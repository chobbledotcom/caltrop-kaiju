/**
 * Test utilities for the caltrop-kaiju game
 */

import { clearEncryptionKeyCache } from "#lib/crypto.ts";
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
 * Test encryption key (32 bytes base64-encoded)
 * This is a valid AES-256 key for testing purposes only
 */
export const TEST_ENCRYPTION_KEY =
  "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";

/**
 * Set up test encryption key in environment
 * Also enables fast PBKDF2 hashing for tests
 */
export const setupTestEncryptionKey = (): void => {
  Deno.env.set("DB_ENCRYPTION_KEY", TEST_ENCRYPTION_KEY);
  Deno.env.set("TEST_PBKDF2_ITERATIONS", "1");
  clearEncryptionKeyCache();
};

/**
 * Clear test encryption key from environment
 */
export const clearTestEncryptionKey = (): void => {
  Deno.env.delete("DB_ENCRYPTION_KEY");
  Deno.env.delete("TEST_PBKDF2_ITERATIONS");
  clearEncryptionKeyCache();
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

/**
 * Options for testRequest helper
 */
interface TestRequestOptions {
  /** Full cookie string */
  cookie?: string;
  /** HTTP method (defaults to GET, or POST if data is provided) */
  method?: string;
  /** Form data for POST requests */
  data?: Record<string, string>;
}

/**
 * Create a test request with common options
 */
export const testRequest = (
  path: string,
  token?: string | null,
  options: TestRequestOptions = {},
): Request => {
  const { cookie, method, data } = options;
  const headers: Record<string, string> = { host: "localhost" };

  if (token) {
    headers.cookie = `__Host-session=${token}`;
  } else if (cookie) {
    headers.cookie = cookie;
  }

  if (data) {
    headers["content-type"] = "application/x-www-form-urlencoded";
    return new Request(`http://localhost${path}`, {
      method: method ?? "POST",
      headers,
      body: new URLSearchParams(data).toString(),
    });
  }

  return new Request(`http://localhost${path}`, {
    method: method ?? "GET",
    headers,
  });
};

/**
 * Create and execute a test request, returning the response
 */
export const awaitTestRequest = async (
  path: string,
  tokenOrOptions?: string | TestRequestOptions | null,
): Promise<Response> => {
  const { handleRequest } = await import("#routes");
  if (typeof tokenOrOptions === "object" && tokenOrOptions !== null) {
    return handleRequest(testRequest(path, null, tokenOrOptions));
  }
  return handleRequest(testRequest(path, tokenOrOptions));
};

// ---------------------------------------------------------------------------
// FP-style curried assertion helpers
// ---------------------------------------------------------------------------

import { expect } from "#test-compat";

/** Assert a Response has the given status code. Returns the response for chaining. */
export const expectStatus =
  (status: number) =>
  (response: Response): Response => {
    expect(response.status).toBe(status);
    return response;
  };

/** Assert a Response is a redirect (302) to the given location. */
export const expectRedirect =
  (location: string) =>
  (response: Response): Response => {
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(location);
    return response;
  };

// ---------------------------------------------------------------------------
// Form validation helpers
// ---------------------------------------------------------------------------

import { type Field, validateForm } from "#lib/forms.tsx";

/** Validate form data and return the result. */
const validateFormData = (fields: Field[], data: Record<string, string>) =>
  validateForm(new URLSearchParams(data), fields);

/** Validate form data against fields and assert the result is valid. Returns the values. */
export const expectValid = (
  fields: Field[],
  data: Record<string, string>,
): Record<string, unknown> => {
  const result = validateFormData(fields, data);
  expect(result.valid).toBe(true);
  if (!result.valid) throw new Error("Expected valid result");
  return result.values;
};

/** Validate form data against fields and assert the result is invalid with given error. */
export const expectInvalid =
  (expectedError: string) =>
  (fields: Field[], data: Record<string, string>): void => {
    const result = validateFormData(fields, data);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toBe(expectedError);
  };

/** Validate form data against fields and assert the result is invalid (any error). */
export const expectInvalidForm = (
  fields: Field[],
  data: Record<string, string>,
): void => {
  expect(validateFormData(fields, data).valid).toBe(false);
};

/** Response factory: creates a callback returning a Response with given status/body. */
export const successResponse =
  (status: number, body?: string) => (): Response =>
    new Response(body ?? null, { status });

/** Error response factory: creates a callback taking an error string. */
export const errorResponse =
  (status: number) =>
  (error: string): Response =>
    new Response(error, { status });
