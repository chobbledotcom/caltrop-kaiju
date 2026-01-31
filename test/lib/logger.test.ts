import { afterEach, beforeEach, describe, expect, spyOn, test } from "#test-compat";
import {
  createRequestTimer,
  ErrorCode,
  logDebug,
  logError,
  logRequest,
  redactPath,
} from "#lib/logger.ts";

describe("logger", () => {
  describe("redactPath", () => {
    test("redacts numeric IDs in paths", () => {
      expect(redactPath("/items/123")).toBe("/items/[id]");
    });

    test("redacts multiple numeric IDs", () => {
      expect(redactPath("/items/123/details/456")).toBe(
        "/items/[id]/details/[id]",
      );
    });

    test("preserves paths without dynamic segments", () => {
      expect(redactPath("/health")).toBe("/health");
      expect(redactPath("/")).toBe("/");
    });

    test("handles trailing slashes with IDs", () => {
      expect(redactPath("/items/123/")).toBe("/items/[id]/");
    });
  });

  describe("logRequest", () => {
    let debugSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
      debugSpy = spyOn(console, "debug");
    });

    afterEach(() => {
      debugSpy.mockRestore();
    });

    test("logs request with redacted path", () => {
      logRequest({
        method: "GET",
        path: "/items/42",
        status: 200,
        durationMs: 42,
      });

      expect(debugSpy).toHaveBeenCalledWith(
        "[Request] GET /items/[id] 200 42ms",
      );
    });

    test("logs POST request", () => {
      logRequest({
        method: "POST",
        path: "/items/123",
        status: 201,
        durationMs: 100,
      });

      expect(debugSpy).toHaveBeenCalledWith(
        "[Request] POST /items/[id] 201 100ms",
      );
    });

    test("logs error status codes", () => {
      logRequest({
        method: "GET",
        path: "/health",
        status: 500,
        durationMs: 5,
      });

      expect(debugSpy).toHaveBeenCalledWith("[Request] GET /health 500 5ms");
    });
  });

  describe("logError", () => {
    let errorSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
      errorSpy = spyOn(console, "error");
    });

    afterEach(() => {
      errorSpy.mockRestore();
    });

    test("logs error code only", () => {
      logError({ code: ErrorCode.DB_CONNECTION });

      expect(errorSpy).toHaveBeenCalledWith("[Error] E_DB_CONNECTION");
    });

    test("logs error with detail", () => {
      logError({ code: ErrorCode.DECRYPT_FAILED, detail: "bad key" });

      expect(errorSpy).toHaveBeenCalledWith(
        '[Error] E_DECRYPT_FAILED detail="bad key"',
      );
    });
  });

  describe("logDebug", () => {
    let debugSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
      debugSpy = spyOn(console, "debug");
    });

    afterEach(() => {
      debugSpy.mockRestore();
    });

    test("logs with Game category", () => {
      logDebug("Game", "Round started");

      expect(debugSpy).toHaveBeenCalledWith("[Game] Round started");
    });

    test("logs with Server category", () => {
      logDebug("Server", "Listening on port 3000");

      expect(debugSpy).toHaveBeenCalledWith("[Server] Listening on port 3000");
    });

    test("logs with Auth category", () => {
      logDebug("Auth", "Session created");

      expect(debugSpy).toHaveBeenCalledWith("[Auth] Session created");
    });
  });

  describe("createRequestTimer", () => {
    test("returns elapsed time in milliseconds", async () => {
      const getElapsed = createRequestTimer();

      // Wait a small amount
      await new Promise((resolve) => setTimeout(resolve, 10));

      const elapsed = getElapsed();
      expect(elapsed).toBeGreaterThanOrEqual(10);
      expect(elapsed).toBeLessThan(100); // Sanity check
    });

    test("returns integer values", () => {
      const getElapsed = createRequestTimer();
      const elapsed = getElapsed();

      expect(Number.isInteger(elapsed)).toBe(true);
    });
  });

  describe("ErrorCode constants", () => {
    test("has expected error codes", () => {
      expect(ErrorCode.DB_CONNECTION).toBe("E_DB_CONNECTION");
      expect(ErrorCode.DB_QUERY).toBe("E_DB_QUERY");
      expect(ErrorCode.DECRYPT_FAILED).toBe("E_DECRYPT_FAILED");
      expect(ErrorCode.ENCRYPT_FAILED).toBe("E_ENCRYPT_FAILED");
      expect(ErrorCode.KEY_DERIVATION).toBe("E_KEY_DERIVATION");
      expect(ErrorCode.VALIDATION_FORM).toBe("E_VALIDATION_FORM");
      expect(ErrorCode.VALIDATION_CONTENT_TYPE).toBe("E_VALIDATION_CONTENT_TYPE");
      expect(ErrorCode.CONFIG_MISSING).toBe("E_CONFIG_MISSING");
    });
  });
});
