import type {
  Col,
  CompassDirection,
  D44,
  DirectionDelta,
  Position,
  Row,
  SpecialLocationConfig,
} from "./types.ts";

// =============================================================================
// Map Dimensions
// =============================================================================

export const MAP_ROWS: Row = 6 as Row;
export const MAP_COLS: Col = 6 as Col;
export const MAP_SIZE = 7;

// =============================================================================
// Starting Positions
// =============================================================================

export const PLAYER_START: Position = { row: 0 as Row, col: 3 as Col };
export const KAIJU_START: Position = { row: 6 as Row, col: 3 as Col };

// =============================================================================
// Special Location Configurations
// =============================================================================

export const SPECIAL_LOCATIONS: readonly SpecialLocationConfig[] = [
  { type: "mountains", position: { row: 0 as Row, col: 3 as Col }, initialDestruction: 0 },
  { type: "telecom_tower", position: { row: 1 as Row, col: 5 as Col }, initialDestruction: 0 },
  { type: "nuclear_plant", position: { row: 2 as Row, col: 0 as Col }, initialDestruction: 0 },
  { type: "city_hall", position: { row: 5 as Row, col: 1 as Col }, initialDestruction: 0 },
  { type: "bridge", position: { row: 5 as Row, col: 5 as Col }, initialDestruction: 0 },
  { type: "docks", position: { row: 6 as Row, col: 3 as Col }, initialDestruction: 1 },
];

// =============================================================================
// Direction Deltas
// =============================================================================

export const DIRECTION_DELTAS: Record<CompassDirection, DirectionDelta> = {
  N: { dRow: -1, dCol: 0 },
  NE: { dRow: -1, dCol: 1 },
  E: { dRow: 0, dCol: 1 },
  SE: { dRow: 1, dCol: 1 },
  S: { dRow: 1, dCol: 0 },
  SW: { dRow: 1, dCol: -1 },
  W: { dRow: 0, dCol: -1 },
  NW: { dRow: -1, dCol: -1 },
};

// =============================================================================
// D44 Direction Table
// =============================================================================

export const D44_DIRECTION_TABLE: Record<D44, CompassDirection> = {
  11: "N",
  12: "NE",
  13: "N",
  14: "NW",
  21: "NE",
  22: "E",
  23: "SE",
  24: "E",
  31: "S",
  32: "SE",
  33: "S",
  34: "SW",
  41: "NW",
  42: "W",
  43: "SW",
  44: "W",
};

// =============================================================================
// Movement Speeds
// =============================================================================

/** Kaiju squares per turn in phase 1 (finding kaiju) */
export const KAIJU_SPEED_PHASE1 = 3;

/** Kaiju squares per turn in phase 2 (searching for base) */
export const KAIJU_SPEED_PHASE2 = 2;

// =============================================================================
// Sighting Thresholds
// =============================================================================

/** Auto-learn weakness on this many sightings */
export const AUTO_LEARN_SIGHTING_COUNT = 5;

// =============================================================================
// Search Phase
// =============================================================================

/** Extra search turns when telecom tower is destroyed */
export const TELECOM_EXTRA_SEARCH_TURNS = 2;

/** Story mode luck points */
export const STORY_MODE_LUCK = 3;

// =============================================================================
// All 8 Compass Directions (useful for adjacency checks)
// =============================================================================

export const ALL_DIRECTIONS: readonly CompassDirection[] = [
  "N", "NE", "E", "SE", "S", "SW", "W", "NW",
];

// =============================================================================
// Opposite Directions (for edge bouncing)
// =============================================================================

export const OPPOSITE_DIRECTION: Record<CompassDirection, CompassDirection> = {
  N: "S",
  NE: "SW",
  E: "W",
  SE: "NW",
  S: "N",
  SW: "NE",
  W: "E",
  NW: "SE",
};
