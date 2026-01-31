/**
 * Shared utilities for route handlers
 */

import { compact, map, pipe } from "#fp";

/**
 * Parse cookies from request
 */
export const parseCookies = (request: Request): Map<string, string> => {
  const header = request.headers.get("cookie");
  if (!header) return new Map<string, string>();

  type CookiePair = [string, string];
  const toPair = (part: string): CookiePair | null => {
    const [key, value] = part.trim().split("=");
    return key && value ? [key, value] : null;
  };

  return pipe(
    map(toPair),
    compact,
    (pairs: [string, string][]) => {
      const m = new Map<string, string>();
      for (const [key, value] of pairs) {
        m.set(key, value);
      }
      return m;
    },
  )(header.split(";"));
};

/**
 * Create HTML response
 */
export const htmlResponse = (html: string, status = 200): Response =>
  new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });

/**
 * Create JSON response
 */
export const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

/**
 * Create 404 not found response
 */
export const notFoundResponse = (): Response =>
  htmlResponse("Not Found", 404);

/**
 * Create redirect response
 */
export const redirect = (url: string, cookie?: string): Response => {
  const headers: HeadersInit = { location: url };
  if (cookie) {
    headers["set-cookie"] = cookie;
  }
  return new Response(null, { status: 302, headers });
};

/**
 * Parse form data from request
 */
export const parseFormData = async (
  request: Request,
): Promise<URLSearchParams> => {
  const text = await request.text();
  return new URLSearchParams(text);
};

/**
 * Get base URL from request
 */
export const getBaseUrl = (request: Request): string => {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
};

/**
 * Normalize path by stripping trailing slashes (except root "/")
 */
export const normalizePath = (path: string): string =>
  path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;

/**
 * Parse request URL and extract path/method
 * Paths are normalized to strip trailing slashes
 */
export const parseRequest = (
  request: Request,
): { url: URL; path: string; method: string } => {
  const url = new URL(request.url);
  return { url, path: normalizePath(url.pathname), method: request.method };
};

/**
 * Get search param from request URL
 */
export const getSearchParam = (
  request: Request,
  key: string,
): string | null => {
  const url = new URL(request.url);
  return url.searchParams.get(key);
};
