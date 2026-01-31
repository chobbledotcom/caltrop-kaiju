/**
 * Entry point for caltrop-kaiju game server
 */

import { handleRequest } from "#routes/index.ts";

const startServer = (port = 3000): void => {
  // biome-ignore lint/suspicious/noConsole: Intentional startup logging
  console.log(`Server starting on http://localhost:${port}`);

  Deno.serve({ port }, (request) => handleRequest(request));
};

const port = Number.parseInt(Deno.env.get("PORT") || "3000", 10);
startServer(port);
