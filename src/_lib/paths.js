import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// src/ directory (parent of _lib/)
const SRC_DIR = join(__dirname, "..");

// Project root directory (parent of src/)
const ROOT_DIR = join(SRC_DIR, "..");

export { SRC_DIR, ROOT_DIR };
