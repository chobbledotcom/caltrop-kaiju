import { compact, map, pipe } from "#fp";
import { DIRECTION_DELTAS, MAP_SIZE } from "./constants.ts";
import { isInBounds } from "./grid.ts";
import type {
  Col,
  CompassDirection,
  DirectionDelta,
  Position,
  Row,
} from "./types.ts";

/**
 * Reverse only the blocked axis of a direction when hitting a map edge.
 *
 * If moving NE and hitting the north edge (row < 0), reverse the N component → SE.
 * If hitting a corner (both axes blocked), reverse both → full opposite.
 */
export const bounceDirection = (
  direction: CompassDirection,
  blockedRow: boolean,
  blockedCol: boolean,
): CompassDirection => {
  const delta = DIRECTION_DELTAS[direction];
  const newDRow = blockedRow ? (-delta.dRow as -1 | 0 | 1) : delta.dRow;
  const newDCol = blockedCol ? (-delta.dCol as -1 | 0 | 1) : delta.dCol;

  return deltaToDirection({ dRow: newDRow, dCol: newDCol });
};

/** Convert a delta back to a compass direction */
export const deltaToDirection = (delta: DirectionDelta): CompassDirection => {
  for (const [dir, d] of Object.entries(DIRECTION_DELTAS)) {
    if (d.dRow === delta.dRow && d.dCol === delta.dCol) {
      return dir as CompassDirection;
    }
  }
  throw new Error(`Invalid delta: ${JSON.stringify(delta)}`);
};

/**
 * Move the kaiju in a straight line for a given number of steps.
 * Returns all positions passed through (not including the starting position).
 * Bounces off map edges by reversing the blocked axis.
 */
export const moveInLine = (
  start: Position,
  direction: CompassDirection,
  steps: number,
): Position[] => {
  const path: Position[] = [];
  let currentRow: number = start.row;
  let currentCol: number = start.col;
  let currentDirection = direction;

  for (let i = 0; i < steps; i++) {
    const delta = DIRECTION_DELTAS[currentDirection];
    let nextRow = currentRow + delta.dRow;
    let nextCol = currentCol + delta.dCol;

    const rowBlocked = !isInBounds(nextRow, currentCol);
    const colBlocked = !isInBounds(currentRow, nextCol);

    if (rowBlocked || colBlocked) {
      currentDirection = bounceDirection(currentDirection, rowBlocked, colBlocked);
      const newDelta = DIRECTION_DELTAS[currentDirection];
      nextRow = currentRow + newDelta.dRow;
      nextCol = currentCol + newDelta.dCol;
    }

    currentRow = nextRow;
    currentCol = nextCol;
    path.push({ row: currentRow as Row, col: currentCol as Col });
  }

  return path;
};

/**
 * Determine the best compass direction for the kaiju to move toward the player.
 * Used in phase 2 (hunting).
 */
export const getHuntDirection = (
  kaijuPos: Position,
  playerPos: Position,
): CompassDirection => {
  const dRow = Math.sign(playerPos.row - kaijuPos.row) as -1 | 0 | 1;
  const dCol = Math.sign(playerPos.col - kaijuPos.col) as -1 | 0 | 1;

  return deltaToDirection({ dRow, dCol });
};

/**
 * Get the valid moves for a player from their current position.
 * Returns all 8 directions + hold, filtered to only positions that are:
 * - In bounds
 * - Not fully destroyed (destruction < 3)
 * - Not blocked by bridge collapse
 */
export const getValidPlayerMoves = (
  position: Position,
  grid: readonly (readonly { destruction: number }[])[],
  bridgeCollapsed: boolean,
  bridgePlayerSide: "west" | "east" | null,
): { direction: CompassDirection; target: Position }[] => {
  const CENTER_COL = Math.floor(MAP_SIZE / 2);

  return pipe(
    map(([dir, delta]: [string, { dRow: number; dCol: number }]) => {
      const newRow = position.row + delta.dRow;
      const newCol = position.col + delta.dCol;

      if (!isInBounds(newRow, newCol)) return null;

      const location = grid[newRow]?.[newCol];
      if (!location || location.destruction >= 3) return null;

      if (bridgeCollapsed && bridgePlayerSide !== null) {
        const crossingLine =
          (position.col <= CENTER_COL && newCol > CENTER_COL) ||
          (position.col > CENTER_COL && newCol <= CENTER_COL);
        if (crossingLine) return null;
      }

      return {
        direction: dir as CompassDirection,
        target: { row: newRow as Row, col: newCol as Col },
      };
    }),
    compact,
  )(Object.entries(DIRECTION_DELTAS));
};
