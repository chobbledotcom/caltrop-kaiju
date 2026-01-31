import * as esbuild from "https://deno.land/x/esbuild@v0.24.2/wasm.js";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.11";

const projectRoot = new URL("..", import.meta.url).pathname;
const configPath = projectRoot + "deno.json";

await esbuild.initialize({});

const result = await esbuild.build({
  plugins: [...denoPlugins({ configPath })],
  entryPoints: [projectRoot + "src/game/main.ts"],
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: false,
  write: false,
});

if (result.errors.length > 0) {
  console.error("Build errors:", result.errors);
  Deno.exit(1);
}

// Write output files manually (WASM esbuild can't write to disk)
const distDir = projectRoot + "dist";
try {
  await Deno.mkdir(distDir, { recursive: true });
} catch { /* already exists */ }

const output = result.outputFiles![0]!;
const outPath = distDir + "/main.js";
await Deno.writeFile(outPath, output.contents);
console.log(`Wrote: dist/main.js (${output.contents.length} bytes)`);

esbuild.stop();
console.log("Build complete.");
