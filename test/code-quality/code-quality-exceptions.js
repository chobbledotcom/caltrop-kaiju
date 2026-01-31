/**
 * Centralized code quality exceptions
 *
 * All whitelisted/grandfathered code quality violations are defined here.
 * These should be removed over time as the codebase is refactored.
 *
 * DO NOT ADD NEW ENTRIES TO THIS FILE UNDER ANY CIRCUMSTANCES.
 * The ONLY valid changes to this file are DELETIONS.
 */

import { frozenSet } from "#toolkit/fp/set.js";

// ============================================
// try/catch exceptions
// ============================================
const ALLOWED_TRY_CATCHES = frozenSet([
  // test/ensure-deps.js - Dependency checking utility
  "test/ensure-deps.js:16",
]);

// ============================================
// process.cwd() exceptions
// ============================================
const ALLOWED_PROCESS_CWD = frozenSet([]);

// ============================================
// Mutable const exceptions (empty [], {}, Set, Map)
// ============================================
const ALLOWED_MUTABLE_CONST = frozenSet([
  "test/test-runner-utils.js",
  "test/code-scanner.js",

  // Test files with imperative accumulation patterns for test setup/assertions
  "test/unit/code-quality/aliasing.test.js",
  "test/unit/code-quality/array-push.test.js",
  "test/unit/code-quality/comment-limits.test.js",
  "test/unit/code-quality/let-usage.test.js",
  "test/unit/code-quality/naming-conventions.test.js",
  "test/unit/code-quality/single-use-functions.test.js",
  "test/unit/code-quality/todo-fixme-comments.test.js",
  "test/unit/code-quality/duplicate-methods.test.js",
  "test/unit/test-runner-utils.test.js",
  "test/unit/toolkit/set.test.js",
]);

// ============================================
// Let declarations exceptions
// ============================================
const ALLOWED_LET = frozenSet([
  "test/code-scanner.js",
  "test/unit/code-quality/comment-limits.test.js",
  "test/unit/code-quality/commented-code.test.js",
  "test/unit/code-quality/let-usage.test.js",
]);

// ============================================
// Single-use unexported function exceptions
// ============================================
const ALLOWED_SINGLE_USE_FUNCTIONS = frozenSet([
  "test/unit/code-quality/comment-limits.test.js",
  "test/unit/code-quality/duplicate-methods.test.js",
]);

// ============================================
// DOM class constructor exceptions
// ============================================
const ALLOWED_DOM_CONSTRUCTOR = frozenSet([
  // This test file tests these patterns
  "test/unit/code-quality/dom-mocking.test.js",
]);

export {
  ALLOWED_TRY_CATCHES,
  ALLOWED_PROCESS_CWD,
  ALLOWED_MUTABLE_CONST,
  ALLOWED_LET,
  ALLOWED_SINGLE_USE_FUNCTIONS,
  ALLOWED_DOM_CONSTRUCTOR,
};
