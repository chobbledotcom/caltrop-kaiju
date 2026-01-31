// Types
export type {
  Col,
  Row,
  Position,
  CompassDirection,
  DirectionDelta,
  D4,
  D44,
  RollType,
  DiceRoll,
  DestructionLevel,
  SpecialLocationType,
  SpecialLocation,
  LocationState,
  PlacementConstraint,
  SpecialLocationConfig,
  BridgeSide,
  BridgeState,
  PlayerStatus,
  DeathCause,
  PlayerState,
  KaijuState,
  GamePhase,
  SightingType,
  PerilousSightingOutcome,
  SaferSightingOutcome,
  SightingOutcome,
  SightingEvent,
  WreckageOutcome,
  SearchEncounterOutcome,
  PlayerAction,
  TurnEvent,
  TurnResult,
  Difficulty,
  GameState,
  DiceProvider,
} from "./types.ts";

// Constants
export {
  MAP_SIZE,
  SPECIAL_LOCATIONS,
  DIRECTION_DELTAS,
  D44_DIRECTION_TABLE,
  KAIJU_SPEED_PHASE1,
  KAIJU_SPEED_PHASE2,
  AUTO_LEARN_SIGHTING_COUNT,
  TELECOM_EXTRA_SEARCH_TURNS,
  STORY_MODE_LUCK,
  ALL_DIRECTIONS,
  OPPOSITE_DIRECTION,
  MIN_SPECIAL_LOCATION_DISTANCE,
} from "./constants.ts";

// Dice
export {
  createRandomDice,
  rollD4,
  toD44,
  lookupD44Direction,
  rollKaijuDirection,
} from "./dice.ts";

// Grid
export {
  isInBounds,
  getNeighbors,
  isAdjacent,
  isSamePosition,
  getLocation,
  chebyshevDistance,
  placeSpecialLocations,
  createGrid,
  findSpecialLocation,
} from "./grid.ts";

// Movement
export {
  bounceDirection,
  deltaToDirection,
  moveInLine,
  getHuntDirection,
  getValidPlayerMoves,
} from "./movement.ts";

// Sighting
export {
  detectSighting,
  resolvePerilous,
  resolveSafer,
  resolveSighting,
  didLearnWeakness,
  wasWoundedBySighting,
  wasKilledBySighting,
} from "./sighting.ts";

// Destruction
export {
  addDestruction,
  triggerSpecialEffect,
  applyKaijuDestruction,
} from "./destruction.ts";

// Combat
export {
  resolveWreckage,
  applyWound,
  resolveSearchEncounter,
  hasDisadvantage,
  consumeTemporaryDisadvantage,
} from "./combat.ts";

// Turn
export { planTurn, resolvePostMovement, completeTurn } from "./turn.ts";
export type { TurnPlan } from "./turn.ts";

// State
export {
  createGameState,
  saveGame,
  loadGame,
  clearSavedGame,
  hasSavedGame,
  isGameOver,
} from "./state.ts";
