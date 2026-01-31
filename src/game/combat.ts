import type {
  D4,
  PlayerState,
  SearchEncounterOutcome,
  WreckageOutcome,
} from "./types.ts";

/** Resolve entering a partially-destroyed location (1 or 2 destruction) */
export const resolveWreckage = (roll: D4): WreckageOutcome => {
  if (roll <= 3) {
    return { type: "safe", roll };
  }
  return { type: "wounded", roll };
};

/** Apply a wound to the player. Returns true if the player died. */
export const applyWound = (player: PlayerState): boolean => {
  if (player.status === "wounded") {
    player.status = "dead";
    player.deathCause = "died_of_wounds";
    return true;
  }
  player.status = "wounded";
  return false;
};

/** Resolve the kaiju catching the player during the search phase */
export const resolveSearchEncounter = (roll: D4): SearchEncounterOutcome => {
  if (roll === 1) {
    return { type: "escape", roll };
  }
  return { type: "eaten", roll };
};

/** Check if the player should roll with disadvantage */
export const hasDisadvantage = (player: PlayerState): boolean =>
  player.status === "wounded" || player.temporaryDisadvantageRolls > 0;

/** Consume one temporary disadvantage roll (call after rolling) */
export const consumeTemporaryDisadvantage = (player: PlayerState): void => {
  if (player.temporaryDisadvantageRolls > 0) {
    player.temporaryDisadvantageRolls -= 1;
  }
};
