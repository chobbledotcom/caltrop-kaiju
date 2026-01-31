import { describe, test, expect } from "#test-compat";
import {
  moveInLine,
  getHuntDirection,
  bounceDirection,
  getValidPlayerMoves,
} from "#game/movement.ts";
import type { Position, Row, Col } from "#game/types.ts";

const pos = (row: number, col: number): Position =>
  ({ row: row as Row, col: col as Col });

describe("moveInLine", () => {
  test("moves 3 squares south from center of north edge", () => {
    const path = moveInLine(pos(0, 3), "S", 3);
    expect(path).toEqual([pos(1, 3), pos(2, 3), pos(3, 3)]);
  });

  test("moves 3 squares east from center", () => {
    const path = moveInLine(pos(3, 3), "E", 3);
    expect(path).toEqual([pos(3, 4), pos(3, 5), pos(3, 6)]);
  });

  test("bounces when hitting east edge", () => {
    // Start at (3, 5), moving east 3 steps:
    // step 1: (3,6), step 2: would be (3,7) → bounce → W → (3,5), step 3: (3,4)
    const path = moveInLine(pos(3, 5), "E", 3);
    expect(path).toEqual([pos(3, 6), pos(3, 5), pos(3, 4)]);
  });

  test("bounces when hitting north edge", () => {
    // Start at (1, 3), moving north 3 steps:
    // step 1: (0,3), step 2: would be (-1,3) → bounce → S → (1,3), step 3: (2,3)
    const path = moveInLine(pos(1, 3), "N", 3);
    expect(path).toEqual([pos(0, 3), pos(1, 3), pos(2, 3)]);
  });

  test("bounces diagonal off south edge", () => {
    // Start at (5, 3), moving SW 3 steps:
    // step 1: (6,2), step 2: would be (7,1) → row blocked → reverse S→N → NW → (5,1)
    // Wait: SW delta is (1,-1). At (6,2), next would be (7,1).
    // Row 7 is out of bounds, col 1 is fine. So only row is blocked.
    // Reverse row component: SW (-1 for dRow becomes +1... no.
    // SW = dRow:1, dCol:-1. Row blocked means reverse dRow: -1. New direction: NW (dRow:-1, dCol:-1)
    // Step 2: (6,2) + NW = (5,1)
    // Step 3: (5,1) + NW = (4,0)
    const path = moveInLine(pos(5, 3), "SW", 3);
    expect(path).toEqual([pos(6, 2), pos(5, 1), pos(4, 0)]);
  });

  test("bounces off corner reverses both axes", () => {
    // Start at (0, 0), moving NW 2 steps:
    // step 1: would be (-1,-1) → both blocked → reverse to SE → (1,1)
    // step 2: (2,2)
    const path = moveInLine(pos(0, 0), "NW", 2);
    expect(path).toEqual([pos(1, 1), pos(2, 2)]);
  });

  test("moves 2 squares for phase 2 speed", () => {
    const path = moveInLine(pos(3, 3), "N", 2);
    expect(path).toEqual([pos(2, 3), pos(1, 3)]);
  });

  test("moves 0 squares returns empty path", () => {
    const path = moveInLine(pos(3, 3), "N", 0);
    expect(path).toEqual([]);
  });
});

describe("bounceDirection", () => {
  test("bouncing east off east wall reverses to west", () => {
    expect(bounceDirection("E", false, true)).toBe("W");
  });

  test("bouncing NE off north wall becomes SE", () => {
    expect(bounceDirection("NE", true, false)).toBe("SE");
  });

  test("bouncing NW off NW corner becomes SE", () => {
    expect(bounceDirection("NW", true, true)).toBe("SE");
  });

  test("bouncing SW off south wall becomes NW", () => {
    expect(bounceDirection("SW", true, false)).toBe("NW");
  });

  test("bouncing SW off west wall becomes SE", () => {
    expect(bounceDirection("SW", false, true)).toBe("SE");
  });
});

describe("getHuntDirection", () => {
  test("kaiju north of player moves south", () => {
    expect(getHuntDirection(pos(1, 3), pos(5, 3))).toBe("S");
  });

  test("kaiju south-east of player moves north-west", () => {
    expect(getHuntDirection(pos(5, 5), pos(2, 2))).toBe("NW");
  });

  test("kaiju on same row to the west moves east", () => {
    expect(getHuntDirection(pos(3, 1), pos(3, 5))).toBe("E");
  });

  test("kaiju diagonally NE of player moves SW", () => {
    expect(getHuntDirection(pos(1, 5), pos(4, 2))).toBe("SW");
  });
});

describe("getValidPlayerMoves", () => {
  const makeGrid = (overrides: Record<string, number> = {}) =>
    Array.from({ length: 7 }, (_, row) =>
      Array.from({ length: 7 }, (_, col) => ({
        destruction: overrides[`${row},${col}`] ?? 0,
      })),
    );

  test("center position has 8 valid moves when all locations intact", () => {
    const moves = getValidPlayerMoves(pos(3, 3), makeGrid(), false, null);
    expect(moves).toHaveLength(8);
  });

  test("corner position has 3 valid moves", () => {
    const moves = getValidPlayerMoves(pos(0, 0), makeGrid(), false, null);
    expect(moves).toHaveLength(3);
  });

  test("fully destroyed adjacent locations are excluded", () => {
    const grid = makeGrid({ "2,3": 3, "4,3": 3 });
    const moves = getValidPlayerMoves(pos(3, 3), grid, false, null);
    // 8 directions minus 2 blocked (N and S of center... wait, N of (3,3) is (2,3) and S is (4,3))
    const blocked = moves.filter(
      m => (m.target.row === 2 && m.target.col === 3) ||
           (m.target.row === 4 && m.target.col === 3)
    );
    expect(blocked).toHaveLength(0);
    expect(moves).toHaveLength(6);
  });

  test("bridge collapse blocks crossing center line from west side", () => {
    // Player on west side (col 2), bridge collapsed
    const moves = getValidPlayerMoves(pos(3, 3), makeGrid(), true, "west");
    // From col 3, center col is 3. West side means col <= 3.
    // Moving east to col 4 would cross the line
    const eastMoves = moves.filter(m => m.target.col > 3);
    expect(eastMoves).toHaveLength(0);
  });

  test("partially destroyed locations are still valid moves", () => {
    const grid = makeGrid({ "2,3": 2 });
    const moves = getValidPlayerMoves(pos(3, 3), grid, false, null);
    const northMove = moves.find(m => m.target.row === 2 && m.target.col === 3);
    expect(northMove).toBeDefined();
  });
});
