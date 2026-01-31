/**
 * Test utilities for caltrop-kaiju
 *
 * Re-exports generic utilities from @chobble/js-toolkit with project-specific
 * wrappers.
 */
import { expect } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { ROOT_DIR } from "#lib/paths.js";
import { omit } from "#toolkit/fp/object.js";

// ============================================
// Project-specific path utilities
// ============================================

const rootDir = ROOT_DIR;

import { memoizedFileGetter } from "#toolkit/test-utils/code-analysis.js";
import { captureConsole } from "#toolkit/test-utils/mocking.js";
import {
  bracket,
  cleanupTempDir,
  createTempFile,
  withMockedProcessExit,
} from "#toolkit/test-utils/resource.js";

// Wrap toolkit's createTempDir to use test directory (not cwd)
const createTempDir = (testName, suffix = "") => {
  const uniqueId = `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 9)}`;
  const dirName = `temp-${testName}${suffix ? `-${suffix}` : ""}-${uniqueId}`;
  const tempDir = path.join(__dirname, dirName);
  fs.mkdirSync(tempDir, { recursive: true });
  return tempDir;
};

// Create project-specific withTempDir using our createTempDir
const withTempDir = bracket(createTempDir, cleanupTempDir);

// ============================================
// File discovery utilities (project-specific ROOT_DIR)
// ============================================

/**
 * Create a memoized file getter for a given pattern.
 */
const memoizedFiles = memoizedFileGetter(rootDir);

// Production JS files: src/ and packages/ (excluding test-utils which are test code)
const SRC_JS_FILES = memoizedFiles(
  /^(src\/|packages\/js-toolkit\/(?!test-utils\/)).*\.js$/,
);
const TEST_FILES = memoizedFiles(/^test\/.*\.js$/);
const ALL_JS_FILES = memoizedFiles(/^(src|test)\/.*\.js$/);

// ============================================
// Re-export toolkit utilities
// ============================================

export { captureConsole, createTempFile, withMockedProcessExit };

// Export project-specific utilities
export {
  expect,
  fs,
  omit,
  path,
  rootDir,
  SRC_JS_FILES,
  TEST_FILES,
  ALL_JS_FILES,
  createTempDir,
  withTempDir,
};
