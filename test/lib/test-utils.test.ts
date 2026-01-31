import { describe, expect, test } from "#test-compat";
import {
  awaitTestRequest,
  mockFormRequest,
  mockRequest,
  randomString,
  testRequest,
  wait,
} from "#test-utils";

describe("test-utils", () => {
  describe("mockRequest", () => {
    test("creates a GET request by default", () => {
      const request = mockRequest("/test");
      expect(request.method).toBe("GET");
      expect(request.url).toBe("http://localhost/test");
    });

    test("accepts custom options", () => {
      const request = mockRequest("/test", { method: "POST" });
      expect(request.method).toBe("POST");
    });
  });

  describe("mockFormRequest", () => {
    test("creates a POST request with form data", async () => {
      const request = mockFormRequest("/test", {
        name: "John",
        email: "john@example.com",
      });
      expect(request.method).toBe("POST");
      expect(request.headers.get("content-type")).toBe(
        "application/x-www-form-urlencoded",
      );

      const body = await request.text();
      expect(body).toContain("name=John");
      expect(body).toContain("email=john%40example.com");
    });

    test("includes cookie when provided", () => {
      const request = mockFormRequest(
        "/test",
        { name: "John" },
        "__Host-session=abc123",
      );
      expect(request.headers.get("cookie")).toBe("__Host-session=abc123");
    });
  });

  describe("testRequest", () => {
    test("creates a GET request by default", () => {
      const request = testRequest("/test");
      expect(request.method).toBe("GET");
      expect(request.url).toBe("http://localhost/test");
      expect(request.headers.get("host")).toBe("localhost");
    });

    test("formats session token as cookie", () => {
      const request = testRequest("/path", "abc123");
      expect(request.headers.get("cookie")).toBe("__Host-session=abc123");
    });

    test("uses raw cookie string when provided", () => {
      const request = testRequest("/path", null, {
        cookie: "__Host-session=xyz; other=value",
      });
      expect(request.headers.get("cookie")).toBe(
        "__Host-session=xyz; other=value",
      );
    });

    test("token takes precedence over cookie", () => {
      const request = testRequest("/path", "token123", {
        cookie: "__Host-session=other",
      });
      expect(request.headers.get("cookie")).toBe("__Host-session=token123");
    });

    test("creates POST request with form data", async () => {
      const request = testRequest("/login", null, {
        data: { username: "admin", password: "secret" },
      });
      expect(request.method).toBe("POST");
      expect(request.headers.get("content-type")).toBe(
        "application/x-www-form-urlencoded",
      );
      const body = await request.text();
      expect(body).toContain("username=admin");
      expect(body).toContain("password=secret");
    });

    test("combines token with form data", async () => {
      const request = testRequest("/submit", "mytoken", {
        data: { name: "Test" },
      });
      expect(request.method).toBe("POST");
      expect(request.headers.get("cookie")).toBe("__Host-session=mytoken");
      const body = await request.text();
      expect(body).toContain("name=Test");
    });

    test("allows custom method override", () => {
      const request = testRequest("/resource/1", "token", {
        method: "DELETE",
      });
      expect(request.method).toBe("DELETE");
    });

    test("allows custom method with form data", async () => {
      const request = testRequest("/resource/1", null, {
        method: "PUT",
        data: { name: "Updated" },
      });
      expect(request.method).toBe("PUT");
      const body = await request.text();
      expect(body).toContain("name=Updated");
    });
  });

  describe("randomString", () => {
    test("generates string of specified length", () => {
      const str = randomString(10);
      expect(str.length).toBe(10);
    });

    test("generates alphanumeric string", () => {
      const str = randomString(100);
      expect(str).toMatch(/^[a-zA-Z0-9]+$/);
    });

    test("generates different strings each time", () => {
      const str1 = randomString(20);
      const str2 = randomString(20);
      expect(str1).not.toBe(str2);
    });
  });

  describe("wait", () => {
    test("waits for specified milliseconds", async () => {
      const start = Date.now();
      await wait(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe("awaitTestRequest", () => {
    test("makes GET request and returns response", async () => {
      const response = await awaitTestRequest("/health");
      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain("ok");
    });

    test("returns 404 for unknown routes", async () => {
      const response = await awaitTestRequest("/nonexistent");
      expect(response.status).toBe(404);
    });

    test("accepts options object as second argument", async () => {
      const response = await awaitTestRequest("/health", {
        method: "POST",
        data: {},
      });
      expect(response.status).toBe(404);
    });
  });
});
