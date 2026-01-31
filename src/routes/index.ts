/**
 * Routes module - main request handler
 */

import { createRequestTimer, logRequest } from "#lib/logger.ts";
import { createRouter, defineRoutes } from "#routes/router.ts";
import type { ServerContext } from "#routes/types.ts";
import { htmlResponse, notFoundResponse, parseRequest } from "#routes/utils.ts";

// Re-export types
export type { ServerContext } from "#routes/types.ts";

/** Health check handler */
const handleHealthCheck = (): Response =>
  new Response(JSON.stringify({ status: "ok" }), {
    headers: { "content-type": "application/json" },
  });

/** Application routes */
const appRoutes = defineRoutes({
  "GET /health": () => handleHealthCheck(),
  "GET /": () => htmlResponse("<h1>caltrop-kaiju</h1>"),
});

const routeApp = createRouter(appRoutes);

/**
 * Handle incoming requests
 */
export const handleRequest = async (
  request: Request,
  server?: ServerContext,
): Promise<Response> => {
  const { path, method } = parseRequest(request);
  const getElapsed = createRequestTimer();

  const response =
    (await routeApp(request, path, method, server)) ?? notFoundResponse();

  logRequest({ method, path, status: response.status, durationMs: getElapsed() });
  return response;
};
