import { describe, test, expect } from "#test-compat";
import {
  isInBounds,
  getNeighbors,
  isAdjacent,
  isSamePosition,
  chebyshevDistance,
  createGrid,
  findSpecialLocation,
  getLocation,
} from "#game/grid.ts";
import { createSequenceDice } from "#test-utils";
import { MAP_SIZE, MIN_SPECIAL_LOCATION_DISTANCE, SPECIAL_LOCATIONS } from "#game/constants.ts";
import type { Position, Row, Col } from "#game/types.ts";

describe("isInBounds", () => {
  test("accepts positions within the 7x7 grid", () => {
    expect(isInBounds(0, 0)).toBe(true);
    expect(isInBounds(6, 6)).toBe(true);
    expect(isInBounds(3, 3)).toBe(true);
  });

  test("rejects positions outside the grid", () => {
    expect(isInBounds(-1, 0)).toBe(false);
    expect(isInBounds(0, -1)).toBe(false);
    expect(isInBounds(7, 0)).toBe(false);
    expect(isInBounds(0, 7)).toBe(false);
  });
});

describe("getNeighbors", () => {
  test("center position has 8 neighbors", () => {
    const neighbors = getNeighbors({ row: 3 as Row, col: 3 as Col });
    expect(neighbors).toHaveLength(8);
  });

  test("corner position has 3 neighbors", () => {
    const neighbors = getNeighbors({ row: 0 as Row, col: 0 as Col });
    expect(neighbors).toHaveLength(3);
  });

  test("edge position has 5 neighbors", () => {
    const neighbors = getNeighbors({ row: 0 as Row, col: 3 as Col });
    expect(neighbors).toHaveLength(5);
  });
});

describe("isAdjacent", () => {
  test("horizontally adjacent positions are adjacent", () => {
    expect(isAdjacent(
      { row: 3 as Row, col: 3 as Col },
      { row: 3 as Row, col: 4 as Col },
    )).toBe(true);
  });

  test("diagonally adjacent positions are adjacent", () => {
    expect(isAdjacent(
      { row: 3 as Row, col: 3 as Col },
      { row: 4 as Row, col: 4 as Col },
    )).toBe(true);
  });

  test("same position is not adjacent", () => {
    expect(isAdjacent(
      { row: 3 as Row, col: 3 as Col },
      { row: 3 as Row, col: 3 as Col },
    )).toBe(false);
  });

  test("positions two squares apart are not adjacent", () => {
    expect(isAdjacent(
      { row: 3 as Row, col: 3 as Col },
      { row: 3 as Row, col: 5 as Col },
    )).toBe(false);
  });
});

describe("isSamePosition", () => {
  test("identical positions are the same", () => {
    expect(isSamePosition(
      { row: 2 as Row, col: 5 as Col },
      { row: 2 as Row, col: 5 as Col },
    )).toBe(true);
  });

  test("different positions are not the same", () => {
    expect(isSamePosition(
      { row: 2 as Row, col: 5 as Col },
      { row: 2 as Row, col: 4 as Col },
    )).toBe(false);
  });
});

describe("createGrid", () => {
  // Provide enough dice for placement (each placement uses 2 dice for random selection)
  // Mountains/docks are fully pinned (0 dice). 4 unconstrained × 3 dice each = 12.
  const makeDice = () =>
    createSequenceDice([1, 1, 2, 2, 3, 3, 4, 4, 1, 2, 3, 4]);

  test("creates a 7x7 grid", () => {
    const { grid } = createGrid(makeDice());
    expect(grid).toHaveLength(MAP_SIZE);
    for (const row of grid) {
      expect(row).toHaveLength(MAP_SIZE);
    }
  });

  test("places all 6 special locations", () => {
    const { grid } = createGrid(makeDice());
    const specialTypes = new Set<string>();

    for (const row of grid) {
      for (const cell of row!) {
        if (cell!.special) {
          specialTypes.add(cell!.special);
        }
      }
    }

    for (const config of SPECIAL_LOCATIONS) {
      expect(specialTypes.has(config.type)).toBe(true);
    }
  });

  test("mountains are placed at top center (0,3)", () => {
    const { grid } = createGrid(makeDice());
    const pos = findSpecialLocation(grid, "mountains");
    expect(pos).toBeDefined();
    expect(pos!.row).toBe(0);
    expect(pos!.col).toBe(3);
  });

  test("docks are placed at bottom center (6,3)", () => {
    const { grid } = createGrid(makeDice());
    const pos = findSpecialLocation(grid, "docks");
    expect(pos).toBeDefined();
    expect(pos!.row).toBe(6);
    expect(pos!.col).toBe(3);
  });

  test("docks start with 1 destruction", () => {
    const { grid } = createGrid(makeDice());
    const pos = findSpecialLocation(grid, "docks")!;
    const location = getLocation(grid, pos);
    expect(location!.destruction).toBe(1);
  });

  test("no two special locations share a position", () => {
    const { grid } = createGrid(makeDice());
    const positions = new Set<string>();

    for (const row of grid) {
      for (const cell of row!) {
        if (cell!.special) {
          const key = `${cell!.position.row},${cell!.position.col}`;
          expect(positions.has(key)).toBe(false);
          positions.add(key);
        }
      }
    }
  });

  test("all non-dock locations start with 0 destruction", () => {
    const { grid } = createGrid(makeDice());

    for (const row of grid) {
      for (const cell of row!) {
        if (cell!.special !== "docks") {
          expect(cell!.destruction).toBe(0);
        }
      }
    }
  });

  test("unconstrained locations are at least MIN_SPECIAL_LOCATION_DISTANCE apart", () => {
    const { grid } = createGrid(makeDice());
    const specialPositions: Position[] = [];

    for (const row of grid) {
      for (const cell of row!) {
        if (cell!.special) {
          specialPositions.push(cell!.position);
        }
      }
    }

    // Check every pair of special locations
    for (let i = 0; i < specialPositions.length; i++) {
      for (let j = i + 1; j < specialPositions.length; j++) {
        const dist = chebyshevDistance(specialPositions[i]!, specialPositions[j]!);
        expect(dist).toBeGreaterThanOrEqual(MIN_SPECIAL_LOCATION_DISTANCE);
      }
    }
  });
});

describe("chebyshevDistance", () => {
  const pos = (row: number, col: number): Position =>
    ({ row: row as Row, col: col as Col });

  test("same position has distance 0", () => {
    expect(chebyshevDistance(pos(3, 3), pos(3, 3))).toBe(0);
  });

  test("adjacent positions have distance 1", () => {
    expect(chebyshevDistance(pos(3, 3), pos(3, 4))).toBe(1);
    expect(chebyshevDistance(pos(3, 3), pos(4, 4))).toBe(1);
  });

  test("positions 2 apart horizontally have distance 2", () => {
    expect(chebyshevDistance(pos(3, 3), pos(3, 5))).toBe(2);
  });

  test("diagonal distance uses the larger axis difference", () => {
    expect(chebyshevDistance(pos(0, 0), pos(3, 6))).toBe(6);
    expect(chebyshevDistance(pos(1, 1), pos(4, 3))).toBe(3);
  });
});
