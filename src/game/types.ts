// =============================================================================
// Grid & Coordinates
// =============================================================================

export const MAP_SIZE = 7;

/** Column index (0 = west, 6 = east) */
export type Col = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Row index (0 = north, 6 = south) */
export type Row = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Position = {
  readonly row: Row;
  readonly col: Col;
};

// =============================================================================
// Compass Directions
// =============================================================================

export type CompassDirection =
  | "N"
  | "NE"
  | "E"
  | "SE"
  | "S"
  | "SW"
  | "W"
  | "NW";

/**
 * Row/col delta for each compass direction.
 * Negative row = north, positive row = south.
 * Negative col = west, positive col = east.
 */
export type DirectionDelta = {
  readonly dRow: -1 | 0 | 1;
  readonly dCol: -1 | 0 | 1;
};

// =============================================================================
// Dice
// =============================================================================

/** A single d4 result */
export type D4 = 1 | 2 | 3 | 4;

/**
 * Two d4 results combined as a two-digit number for the kaiju direction table.
 * First die is the "tens" digit, second is the "ones" digit.
 */
export type D44 =
  | 11
  | 12
  | 13
  | 14
  | 21
  | 22
  | 23
  | 24
  | 31
  | 32
  | 33
  | 34
  | 41
  | 42
  | 43
  | 44;

export type RollType = "normal" | "disadvantage";

export type DiceRoll = {
  readonly type: RollType;
  readonly dice: readonly D4[];
  /** The effective result after applying disadvantage (take higher) */
  readonly result: D4;
};

// =============================================================================
// Destruction & Locations
// =============================================================================

/** 0 = intact, 1-2 = partially destroyed, 3 = fully destroyed */
export type DestructionLevel = 0 | 1 | 2 | 3;

export type SpecialLocationType =
  | "mountains"
  | "telecom_tower"
  | "nuclear_plant"
  | "city_hall"
  | "bridge"
  | "docks";

export type SpecialLocation = {
  readonly type: SpecialLocationType;
  readonly position: Position;
  /** Whether this location's special effect has already triggered */
  triggered: boolean;
};

export type LocationState = {
  readonly position: Position;
  destruction: DestructionLevel;
  /** Which special location is here, if any */
  readonly special: SpecialLocationType | null;
  /** Whether the special event has already triggered */
  specialTriggered: boolean;
  /** How many times this location has been searched (phase 2) */
  searchCount: number;
};

// =============================================================================
// Special Location Starting Positions
// =============================================================================

export type SpecialLocationConfig = {
  readonly type: SpecialLocationType;
  readonly position: Position;
  /** Starting destruction level (docks starts at 1) */
  readonly initialDestruction: DestructionLevel;
};

// =============================================================================
// Bridge Split
// =============================================================================

export type BridgeSide = "west" | "east";

export type BridgeState =
  | { readonly collapsed: false }
  | { readonly collapsed: true; readonly playerSide: BridgeSide }
  | { readonly collapsed: true; readonly playerSide: null; readonly mustChoose: true };

// =============================================================================
// Player State
// =============================================================================

export type PlayerStatus = "alive" | "wounded" | "dead";

export type DeathCause =
  | "killed_by_kaiju_sighting"
  | "killed_by_kaiju_searching"
  | "killed_by_destruction"
  | "died_of_wounds"
  | "killed_in_final_encounter";

export type PlayerState = {
  position: Position;
  status: PlayerStatus;
  deathCause: DeathCause | null;
  /**
   * Temporary disadvantage from mountain home destruction.
   * Decrements after each roll; when 0 no extra disadvantage applies.
   */
  temporaryDisadvantageRolls: number;
  sightingCount: number;
  /** Whether the player has learned the kaiju's weakness */
  knowsWeakness: boolean;
  /** Number of locations still needed to find the military base (phase 2) */
  locationsToSearch: number;
  /** Luck points remaining (story mode only, 0 in normal mode) */
  luck: number;
};

// =============================================================================
// Kaiju State
// =============================================================================

export type KaijuState = {
  position: Position;
};

// =============================================================================
// Game Phases
// =============================================================================

/**
 * Phase 1: Player is trying to observe the kaiju to learn its weakness.
 *   - Kaiju moves randomly (d44 table), 3 squares per turn.
 *
 * Phase 2: Player knows weakness, searching for military base.
 *   - Kaiju hunts player, 2 squares per turn.
 *   - Player must search locations (move into unsearched, non-destroyed squares).
 *
 * Ended: Game is over (victory or defeat).
 */
export type GamePhase =
  | { readonly phase: "finding_kaiju" }
  | {
      readonly phase: "searching_base";
      /** Turns of extra searching due to telecom tower destruction */
      extraSearchTurns: number;
    }
  | { readonly phase: "victory" }
  | { readonly phase: "defeat"; readonly cause: DeathCause };

// =============================================================================
// Sightings
// =============================================================================

export type SightingType = "perilous" | "safer";

export type PerilousSightingOutcome =
  | { readonly type: "unharmed_learned"; readonly roll: D4 }
  | { readonly type: "wounded_learned"; readonly roll: D4 }
  | { readonly type: "wounded_no_learn"; readonly roll: D4 }
  | { readonly type: "killed"; readonly roll: D4 };

export type SaferSightingOutcome =
  | { readonly type: "learned"; readonly roll: D4 }
  | { readonly type: "no_learn"; readonly roll: D4 };

export type SightingOutcome = PerilousSightingOutcome | SaferSightingOutcome;

export type SightingEvent = {
  readonly sightingType: SightingType;
  readonly outcome: SightingOutcome;
  /** Was this the auto-learn 5th sighting? */
  readonly autoLearned: boolean;
};

// =============================================================================
// Wreckage Navigation (entering partially destroyed locations)
// =============================================================================

export type WreckageOutcome =
  | { readonly type: "safe"; readonly roll: D4 }
  | { readonly type: "wounded"; readonly roll: D4 };

// =============================================================================
// Search Phase Encounter (kaiju catches you while searching)
// =============================================================================

export type SearchEncounterOutcome =
  | { readonly type: "escape"; readonly roll: D4 }
  | { readonly type: "eaten"; readonly roll: D4 };

// =============================================================================
// Turn Actions
// =============================================================================

/** Player can move one square in any direction, or hold still */
export type PlayerAction =
  | { readonly type: "move"; readonly direction: CompassDirection }
  | { readonly type: "hold" };

// =============================================================================
// Turn Events - things that happen during a turn
// =============================================================================

export type TurnEvent =
  | { readonly event: "wreckage_roll"; readonly outcome: WreckageOutcome }
  | { readonly event: "sighting"; readonly detail: SightingEvent }
  | { readonly event: "search_encounter"; readonly outcome: SearchEncounterOutcome }
  | { readonly event: "location_searched"; readonly position: Position }
  | { readonly event: "special_triggered"; readonly locationType: SpecialLocationType }
  | { readonly event: "destruction"; readonly position: Position; readonly newLevel: DestructionLevel }
  | { readonly event: "player_killed"; readonly cause: DeathCause }
  | { readonly event: "base_found" }
  | { readonly event: "kaiju_flees" }
  | { readonly event: "bridge_collapsed" }
  | { readonly event: "telecom_destroyed" }
  | { readonly event: "nuclear_meltdown" }
  | { readonly event: "city_hall_riots" }
  | { readonly event: "mountain_home_destroyed" }
  | { readonly event: "final_encounter"; readonly outcome: PerilousSightingOutcome };

export type TurnResult = {
  readonly playerAction: PlayerAction;
  readonly kaijuDirection: CompassDirection;
  /** All positions the kaiju moved through this turn (in order) */
  readonly kaijuPath: readonly Position[];
  readonly events: readonly TurnEvent[];
};

// =============================================================================
// Difficulty
// =============================================================================

export type Difficulty = "normal" | "story";

// =============================================================================
// Full Game State
// =============================================================================

export type GameState = {
  readonly difficulty: Difficulty;
  player: PlayerState;
  kaiju: KaijuState;
  phase: GamePhase;
  bridge: BridgeState;
  /** 7x7 grid of location states, indexed as grid[row][col] */
  grid: LocationState[][];
  turnNumber: number;
  /** Full history of turn results */
  turnHistory: TurnResult[];
};

// =============================================================================
// Dice Provider (for testability)
// =============================================================================

/** Abstract dice roller - swap in deterministic version for tests */
export type DiceProvider = {
  readonly rollD4: () => D4;
};
