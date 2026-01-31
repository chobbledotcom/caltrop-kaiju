#!/usr/bin/env -S deno run --allow-all
/**
 * Test runner script
 */

import { dirname, fromFileUrl, join } from "jsr:@std/path@1";

const projectRoot = join(dirname(fromFileUrl(import.meta.url)), "..");

/** Main: run tests */
const main = async (): Promise<void> => {
  // Get test args (pass through any CLI args after --)
  const testArgs = Deno.args;
  const useCoverage = testArgs.includes("--coverage");

  const denoTestArgs = [
    "test",
    "--no-check",
    "--allow-net",
    "--allow-env",
    "--allow-read",
    "--allow-write",
    "--allow-run",
    "--allow-sys",
    "--allow-ffi",
  ];

  if (useCoverage) {
    denoTestArgs.push("--coverage=coverage");
  }

  denoTestArgs.push("test/");

  // biome-ignore lint/suspicious/noConsole: Intentional test logging
  console.log("Running tests...");
  const testCmd = new Deno.Command(Deno.execPath(), {
    args: denoTestArgs,
    cwd: projectRoot,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: {
      ...Deno.env.toObject(),
      DB_ENCRYPTION_KEY: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
    },
  });

  const result = await testCmd.output();

  Deno.exit(result.code);
};

main();
