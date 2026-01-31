import { describe, expect, test } from "bun:test";
import { SRC_JS_FILES, TEST_FILES } from "#test/test-utils.js";

describe("test-hygiene", () => {
  test("Pre-computed file lists contain files", () => {
    expect(SRC_JS_FILES().length).toBeGreaterThan(0);
    expect(TEST_FILES().length).toBeGreaterThan(0);
  });
});
