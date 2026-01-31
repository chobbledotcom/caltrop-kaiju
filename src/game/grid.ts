import { compact, filter, flatMap, map, pipe } from "#fp";
import { ALL_DIRECTIONS, DIRECTION_DELTAS, MAP_SIZE, MIN_SPECIAL_LOCATION_DISTANCE, SPECIAL_LOCATIONS } from "./constants.ts";
import type {
  Col,
  DiceProvider,
  LocationState,
  Position,
  Row,
  SpecialLocationConfig,
  SpecialLocationType,
} from "./types.ts";

/** Check if a position is within map bounds */
export const isInBounds = (row: number, col: number): boolean =>
  row >= 0 && row < MAP_SIZE && col >= 0 && col < MAP_SIZE;

/** Get all valid adjacent positions (8 directions) */
export const getNeighbors = (pos: Position): Position[] =>
  pipe(
    map((dir: (typeof ALL_DIRECTIONS)[number]) => {
      const delta = DIRECTION_DELTAS[dir];
      const newRow = pos.row + delta.dRow;
      const newCol = pos.col + delta.dCol;
      return isInBounds(newRow, newCol)
        ? { row: newRow as Row, col: newCol as Col }
        : null;
    }),
    compact,
  )([...ALL_DIRECTIONS]);

/** Check if two positions are adjacent (including diagonals) */
export const isAdjacent = (a: Position, b: Position): boolean =>
  Math.abs(a.row - b.row) <= 1 &&
  Math.abs(a.col - b.col) <= 1 &&
  (a.row !== b.row || a.col !== b.col);

/** Check if two positions are the same */
export const isSamePosition = (a: Position, b: Position): boolean =>
  a.row === b.row && a.col === b.col;

/** Get a location from the grid */
export const getLocation = (
  grid: LocationState[][],
  pos: Position,
): LocationState | undefined => grid[pos.row]?.[pos.col];

/** Chebyshev (king-move) distance between two positions */
export const chebyshevDistance = (a: Position, b: Position): number =>
  Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));

/**
 * Randomly place special locations on the grid.
 * Processes constrained locations first (those with pinned row/col),
 * then unconstrained ones into remaining open cells.
 * Unconstrained locations must be at least MIN_SPECIAL_LOCATION_DISTANCE
 * from all previously placed locations.
 */
export const placeSpecialLocations = (
  dice: DiceProvider,
): Map<string, SpecialLocationType> => {
  const placed = new Map<string, SpecialLocationType>();
  const placedPositions: Position[] = [];
  const posKey = (row: number, col: number): string => `${row},${col}`;

  const isTooClose = (row: number, col: number): boolean =>
    placedPositions.some((p) =>
      chebyshevDistance(p, { row: row as Row, col: col as Col }) < MIN_SPECIAL_LOCATION_DISTANCE
    );

  const pickRandom = (options: number[]): number => {
    const index = ((dice.rollD4() - 1) + (dice.rollD4() - 1) * 4 + (dice.rollD4() - 1) * 16) % options.length;
    return options[index]!;
  };

  // Sort: constrained locations first (those with pinned row or col)
  const hasConstraint = (c: SpecialLocationConfig): boolean =>
    c.placement.row !== null || c.placement.col !== null;

  const constrained = filter(hasConstraint)(
    [...SPECIAL_LOCATIONS],
  );
  const unconstrained = filter((c: SpecialLocationConfig) => !hasConstraint(c))(
    [...SPECIAL_LOCATIONS],
  );
  const ordered = [...constrained, ...unconstrained];

  for (const config of ordered) {
    const { placement } = config;
    const isFullyPinned = placement.row !== null && placement.col !== null;

    const rangeOrPin = (pin: number | null): number[] =>
      pin !== null ? [pin] : Array.from({ length: MAP_SIZE }, (_, i) => i);

    const candidateRows = rangeOrPin(placement.row);
    const candidateCols = rangeOrPin(placement.col);

    const openCells = pipe(
      flatMap((row: number) =>
        pipe(
          filter((col: number) =>
            !placed.has(posKey(row, col)) && (isFullyPinned || !isTooClose(row, col))
          ),
          map((col: number) => ({ row: row as Row, col: col as Col })),
        )(candidateCols)
      ),
    )(candidateRows);

    if (openCells.length === 0) {
      throw new Error(
        `No valid position for special location: ${config.type}`,
      );
    }

    const chosenIndex = openCells.length === 1
      ? 0
      : pickRandom(Array.from({ length: openCells.length }, (_, i) => i));
    const chosen = openCells[chosenIndex]!;
    placed.set(posKey(chosen.row, chosen.col), config.type);
    placedPositions.push(chosen);
  }

  return placed;
};

/** Create initial 7x7 grid with special locations placed */
export const createGrid = (
  dice: DiceProvider,
): { grid: LocationState[][]; placements: Map<string, SpecialLocationType> } => {
  const placements = placeSpecialLocations(dice);

  const grid: LocationState[][] = Array.from({ length: MAP_SIZE }, (_, row) =>
    Array.from({ length: MAP_SIZE }, (_, col) => {
      const key = `${row},${col}`;
      const special = placements.get(key) ?? null;
      const config = special
        ? SPECIAL_LOCATIONS.find((s) => s.type === special)
        : undefined;

      return {
        position: { row: row as Row, col: col as Col },
        destruction: config?.initialDestruction ?? 0,
        special,
        specialTriggered: false,
        searchCount: 0,
      } satisfies LocationState;
    }),
  );

  return { grid, placements };
};

/** Find the position of a special location on the grid */
export const findSpecialLocation = (
  grid: LocationState[][],
  type: SpecialLocationType,
): Position | undefined => {
  for (const row of grid) {
    for (const cell of row!) {
      if (cell!.special === type) {
        return cell!.position;
      }
    }
  }
  return undefined;
};
