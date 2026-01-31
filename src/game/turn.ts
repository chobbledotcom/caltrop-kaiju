import { KAIJU_SPEED_PHASE1, KAIJU_SPEED_PHASE2 } from "./constants.ts";
import {
  applyWound,
  consumeTemporaryDisadvantage,
  hasDisadvantage,
  resolveSearchEncounter,
  resolveWreckage,
} from "./combat.ts";
import { rollD4, rollKaijuDirection } from "./dice.ts";
import { applyKaijuDestruction } from "./destruction.ts";
import { getLocation, isSamePosition } from "./grid.ts";
import { getHuntDirection, moveInLine } from "./movement.ts";
import {
  detectSighting,
  didLearnWeakness,
  resolvePerilous,
  resolveSighting,
  wasKilledBySighting,
  wasWoundedBySighting,
} from "./sighting.ts";
import type {
  CompassDirection,
  DiceProvider,
  DiceRoll,
  GameState,
  PlayerAction,
  Position,
  TurnEvent,
  TurnResult,
} from "./types.ts";

/** Roll a d4, applying disadvantage if applicable and consuming temporary disadvantage */
const rollWithDisadvantage = (state: GameState, dice: DiceProvider): DiceRoll => {
  const disadvantage = hasDisadvantage(state.player);
  const roll = rollD4(dice, disadvantage);
  consumeTemporaryDisadvantage(state.player);
  return roll;
};

/** Apply a wound and push a death event if the player died. Returns true if dead. */
const applyWoundOrDie = (state: GameState, events: TurnEvent[]): boolean => {
  const died = applyWound(state.player);
  if (died) {
    events.push({ event: "player_killed", cause: "died_of_wounds" });
  }
  return died;
};

// =============================================================================
// Turn Plan - separates player action from kaiju movement for animation
// =============================================================================

export type TurnPlan = {
  readonly kaijuDirection: CompassDirection;
  readonly kaijuPath: Position[];
  readonly playerEvents: TurnEvent[];
  readonly playerDiedEarly: boolean;
};

/**
 * Execute the player's action and calculate the kaiju's movement plan.
 * Mutates player state (position, wreckage wounds, bridge choice) but does NOT
 * apply kaiju movement or destruction. Returns the plan for the kaiju's path.
 */
export const planTurn = (
  state: GameState,
  action: PlayerAction,
  dice: DiceProvider,
): TurnPlan => {
  const events: TurnEvent[] = [];

  // --- Player movement ---
  if (action.type === "move") {
    const delta = { N: [-1, 0], NE: [-1, 1], E: [0, 1], SE: [1, 1], S: [1, 0], SW: [1, -1], W: [0, -1], NW: [-1, -1] } as const;
    const [dRow, dCol] = delta[action.direction];
    state.player.position = {
      row: (state.player.position.row + dRow) as Position["row"],
      col: (state.player.position.col + dCol) as Position["col"],
    };

    // Check wreckage on entering partially-destroyed location
    const playerLocation = getLocation(state.grid, state.player.position);
    if (playerLocation && playerLocation.destruction > 0 && playerLocation.destruction < 3) {
      const roll = rollWithDisadvantage(state, dice);
      const outcome = resolveWreckage(roll.result);
      events.push({ event: "wreckage_roll", outcome });

      if (outcome.type === "wounded" && applyWoundOrDie(state, events)) {
        return { kaijuDirection: "N", kaijuPath: [], playerEvents: events, playerDiedEarly: true };
      }
    }
  }

  // Handle bridge side choice
  if (
    state.bridge.collapsed &&
    "mustChoose" in state.bridge &&
    state.bridge.mustChoose &&
    action.type === "move"
  ) {
    const CENTER_COL = 3;
    if (state.player.position.col < CENTER_COL) {
      state.bridge = { collapsed: true, playerSide: "west" };
    } else if (state.player.position.col > CENTER_COL) {
      state.bridge = { collapsed: true, playerSide: "east" };
    }
    // Still on center? Stay in mustChoose state
  }

  // --- Kaiju movement calculation ---
  let kaijuDirection: CompassDirection;
  let kaijuPath: Position[];

  if (state.phase.phase === "finding_kaiju") {
    const { direction } = rollKaijuDirection(dice);
    kaijuDirection = direction;
    kaijuPath = moveInLine(state.kaiju.position, direction, KAIJU_SPEED_PHASE1);
  } else {
    kaijuDirection = getHuntDirection(state.kaiju.position, state.player.position);
    kaijuPath = moveInLine(state.kaiju.position, kaijuDirection, KAIJU_SPEED_PHASE2);
  }

  return { kaijuDirection, kaijuPath, playerEvents: events, playerDiedEarly: false };
};

/**
 * Resolve sighting, encounter, and search after all kaiju movement is complete.
 * This should be called after all kaiju steps have been applied.
 */
export const resolvePostMovement = (
  state: GameState,
  action: PlayerAction,
  kaijuPath: Position[],
  dice: DiceProvider,
): TurnEvent[] => {
  const events: TurnEvent[] = [];

  if (state.phase.phase === "finding_kaiju") {
    // Check for sighting (kaiju path + player position)
    const sightingType = detectSighting(state.player.position, kaijuPath);
    if (sightingType) {
      const roll = rollWithDisadvantage(state, dice);
      const sightingEvent = resolveSighting(sightingType, roll.result, state.player.sightingCount);
      state.player.sightingCount += 1;
      events.push({ event: "sighting", detail: sightingEvent });

      if (wasKilledBySighting(sightingEvent)) {
        state.player.status = "dead";
        state.player.deathCause = "killed_by_kaiju_sighting";
        events.push({ event: "player_killed", cause: "killed_by_kaiju_sighting" });
        return events;
      }

      if (wasWoundedBySighting(sightingEvent) && applyWoundOrDie(state, events)) {
        return events;
      }

      if (didLearnWeakness(sightingEvent)) {
        state.player.knowsWeakness = true;
        transitionToSearchPhase(state, dice);
      }
    }
  } else if (state.phase.phase === "searching_base") {
    // Check if kaiju caught the player
    const caught = kaijuPath.some((pos) => isSamePosition(pos, state.player.position));
    if (caught) {
      const roll = rollWithDisadvantage(state, dice);
      const outcome = resolveSearchEncounter(roll.result);
      events.push({ event: "search_encounter", outcome });

      if (outcome.type === "eaten") {
        state.player.status = "dead";
        state.player.deathCause = "killed_by_kaiju_searching";
        events.push({ event: "player_killed", cause: "killed_by_kaiju_searching" });
        return events;
      }
    }

    // Count search (player moved into a location)
    if (action.type === "move") {
      const location = getLocation(state.grid, state.player.position);
      if (location && location.destruction < 3) {
        location.searchCount += 1;
        events.push({ event: "location_searched", position: state.player.position });
        state.player.locationsToSearch -= 1;

        if (state.player.locationsToSearch <= 0) {
          events.push({ event: "base_found" });
          events.push(...resolveVictory(state, dice));
        }
      }
    }
  }

  return events;
};

/** Finalize turn: update counters and return result */
export const completeTurn = (
  state: GameState,
  action: PlayerAction,
  kaijuDirection: CompassDirection,
  kaijuPath: Position[],
  events: TurnEvent[],
): TurnResult => {
  // Update phase to defeat if player died
  if (state.player.status === "dead" && state.player.deathCause) {
    state.phase = { phase: "defeat", cause: state.player.deathCause };
  }

  state.turnNumber += 1;

  const result: TurnResult = {
    playerAction: action,
    kaijuDirection,
    kaijuPath,
    events,
  };

  state.turnHistory.push(result);
  return result;
};

/** Transition from finding_kaiju to searching_base */
const transitionToSearchPhase = (
  state: GameState,
  dice: DiceProvider,
): void => {
  const searchRoll = dice.rollD4();
  let locationsToSearch = searchRoll + 3;

  // Check if telecom tower was already destroyed
  for (const row of state.grid) {
    for (const cell of row!) {
      if (cell!.special === "telecom_tower" && cell!.specialTriggered) {
        locationsToSearch += 2;
      }
    }
  }

  state.player.locationsToSearch = locationsToSearch;
  state.phase = { phase: "searching_base", extraSearchTurns: 0 };
};

/**
 * Resolve victory: kaiju flees south, causing destruction.
 * If it passes through the player's square, resolve a final perilous encounter.
 */
const resolveVictory = (
  state: GameState,
  dice: DiceProvider,
): TurnEvent[] => {
  const events: TurnEvent[] = [];
  events.push({ event: "kaiju_flees" });

  // Kaiju flees directly south from current position to the bottom of the map
  const kaijuRow = state.kaiju.position.row;
  const kaijuCol = state.kaiju.position.col;
  const fleePath: Position[] = [];

  for (let row = kaijuRow + 1; row < 7; row++) {
    fleePath.push({ row: row as Position["row"], col: kaijuCol });
  }

  for (const pos of fleePath) {
    events.push(...applyKaijuDestruction(state, pos));
  }

  // Check if kaiju passes through player's square
  const passesPlayer = fleePath.some((pos) =>
    isSamePosition(pos, state.player.position),
  );

  if (passesPlayer && state.player.status !== "dead") {
    const roll = rollWithDisadvantage(state, dice);

    // Use perilous sighting table for final encounter
    const outcome = resolvePerilous(roll.result);
    events.push({ event: "final_encounter", outcome });

    if (outcome.type === "killed") {
      state.player.status = "dead";
      state.player.deathCause = "killed_in_final_encounter";
      events.push({ event: "player_killed", cause: "killed_in_final_encounter" });
      state.phase = { phase: "defeat", cause: "killed_in_final_encounter" };
      return events;
    }

    if (outcome.type === "wounded_learned" || outcome.type === "wounded_no_learn") {
      if (applyWoundOrDie(state, events)) {
        state.phase = { phase: "defeat", cause: "died_of_wounds" };
        return events;
      }
    }
  }

  if (state.player.status !== "dead") {
    state.phase = { phase: "victory" };
  }

  return events;
};
