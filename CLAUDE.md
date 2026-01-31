# CLAUDE.md - AI Assistant Guide for Caltrop Kaiju

## Project Overview

**Caltrop Kaiju** is a JavaScript game built with **Bun** as the package manager and runtime.

---

## Quick Reference

### Essential Commands
```bash
bun install          # Install dependencies (MUST use bun, not npm)
bun test             # Full test suite (lint + typecheck + cpd + tests + coverage)
bun run test:unit    # Unit tests only
bun run lint         # Check code with Biome
bun run lint:fix     # Auto-fix lint issues
bun run precommit    # Pre-commit checks
```

### Directory Structure
```
src/
├── _lib/            # Core library code
│   └── paths.js     # Project path constants

packages/
└── js-toolkit/      # Functional JS utilities, test infra, code quality tools
    ├── fp/          # Functional programming utilities (array, object, set, etc.)
    ├── test-utils/  # Test assertions, mocking, resource management
    ├── code-quality/ # Code quality scanner and runner
    └── configs/     # Base configs for biome, bunfig, jscpd, knip

test/
├── unit/            # Unit tests
│   ├── code-quality/ # Code quality enforcement tests
│   └── toolkit/     # FP toolkit tests
├── code-quality/    # Code quality exceptions
├── code-scanner.js  # Code scanning utilities
├── test-utils.js    # Shared test utilities
└── run-tests.js     # Full test suite runner
```

---

## Import Aliases

Use Node.js subpath imports (defined in `package.json`):

```javascript
import { pipe, filter, map } from "#toolkit/fp/array.js";
import { ROOT_DIR } from "#lib/paths.js";
```

**Available aliases:**
| Alias | Path |
|-------|------|
| `#lib/*` | `./src/_lib/*` |
| `#src/*` | `./src/*` |
| `#test/*` | `./test/*` |
| `#toolkit/*` | `./packages/js-toolkit/*` |

---

## Code Conventions

### Functional Programming Style
The codebase uses curried, composable functions extensively:

```javascript
import { pipe, filter, map, sort } from "#toolkit/fp/array.js";

pipe(
  filter(x => x > 0),
  map(x => x * 2),
  sort((a, b) => a - b)
)(numbers);
```

### Available Array Utilities (`#toolkit/fp/array.js`)
- `pipe(...fns)` - Left-to-right function composition
- `filter(predicate)`, `map(fn)`, `flatMap(fn)`, `reduce(fn, initial)` - Curried array methods
- `sort(comparator)` - Non-mutating sort
- `unique(arr)`, `uniqueBy(getKey)` - Deduplicate arrays
- `filterMap(predicate, transform)` - Filter and map in single pass
- `compact(arr)` - Remove falsy values
- `chunk(arr, size)` - Split into groups
- `pick(keys)` - Extract object properties
- `accumulate(fn)` - Safe array building in reduce

### Error Handling: Fail Fast, Never Mask

**Throw errors instead of returning fallback values.**

```javascript
// BAD
const getItem = (id) => items.find(i => i.id === id) ?? { name: "Unknown" };

// GOOD
const getItem = (id) => {
  const item = items.find(i => i.id === id);
  if (!item) throw new Error(`Item not found: ${id}`);
  return item;
};
```

---

## Linting Rules (Biome)

### Must Follow
- **Use arrow functions** - `useArrowFunction: error`
- **Use template literals** - `useTemplate: error`
- **Use const** - `useConst: error`
- **No var** - `noVar: error`
- **No ==** - `noDoubleEquals: error` (use `===`)
- **No unused imports/variables** - `noUnusedImports: error`, `noUnusedVariables: error`
- **No forEach** - `noForEach: error` (use `for...of` or curried `map`/`filter`)
- **No accumulating spread** - `noAccumulatingSpread: error` (use `accumulate()` helper)
- **Max cognitive complexity: 10** - `noExcessiveCognitiveComplexity: 10`
- **No console.log** - except in test files
- **No skipped/focused tests** - `noSkippedTests: error`, `noFocusedTests: error`

### Formatting
- 2-space indentation
- Run `bun run lint:fix` to auto-format

---

## Testing Requirements

### Test Framework
- **Bun's native test runner** with happy-dom for DOM simulation
- Tests in `/test/unit/`
- Shared utilities in `/test/test-utils.js`

### Test Quality Criteria
1. **Tests Production Code, Not Reimplementations**
2. **Not Tautological**
3. **Tests Behavior, Not Implementation Details**
4. **Has Clear Failure Semantics**
5. **Isolated and Repeatable**
6. **Tests One Thing**

---

## Anti-Patterns to Avoid

1. **Don't use npm** - This project requires Bun
2. **Don't use `forEach`** - Use `for...of` loops or curried `map`/`filter`
3. **Don't accumulate with spread** - Use `accumulate()` helper
4. **Don't use `var`** - Always use `const` (or `let` when reassignment needed)
5. **Don't use `==`** - Always use `===`
6. **Don't add console.log** - Except in tests
7. **Don't exceed complexity 10** - Break complex functions into smaller pieces
8. **Don't return fallbacks for errors** - Throw errors instead

---

## When Making Changes

1. **Read existing code first** - Understand patterns before modifying
2. **Follow existing conventions** - Match the style of surrounding code
3. **Run tests** - `bun test` before committing
4. **Run linter** - `bun run lint:fix` to auto-fix issues
5. **Keep functions small** - Stay under complexity limit of 10
6. **Use functional patterns** - Prefer `pipe`, curried functions, immutability
7. **Write tests** - Follow the test quality criteria
8. **Use import aliases** - Keep imports clean with `#` prefixes
