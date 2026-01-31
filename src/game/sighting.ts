import { AUTO_LEARN_SIGHTING_COUNT } from "./constants.ts";
import { isAdjacent, isSamePosition } from "./grid.ts";
import type {
  D4,
  PerilousSightingOutcome,
  Position,
  SaferSightingOutcome,
  SightingEvent,
  SightingType,
} from "./types.ts";

/**
 * Detect whether a sighting occurs given the player position and the kaiju's path.
 * Returns "perilous" if the kaiju passes through or ends on the player's square,
 * "safer" if it passes through or ends on an adjacent square,
 * or null if no sighting occurs.
 *
 * Only one sighting per turn — perilous takes priority.
 */
export const detectSighting = (
  playerPos: Position,
  kaijuPath: readonly Position[],
): SightingType | null => {
  let safer = false;

  for (const pos of kaijuPath) {
    if (isSamePosition(playerPos, pos)) {
      return "perilous";
    }
    if (isAdjacent(playerPos, pos)) {
      safer = true;
    }
  }

  return safer ? "safer" : null;
};

/** Resolve a perilous sighting roll */
export const resolvePerilous = (roll: D4): PerilousSightingOutcome => {
  switch (roll) {
    case 1:
      return { type: "unharmed_learned", roll };
    case 2:
      return { type: "wounded_learned", roll };
    case 3:
      return { type: "wounded_no_learn", roll };
    case 4:
      return { type: "killed", roll };
  }
};

/** Resolve a safer sighting roll */
export const resolveSafer = (roll: D4): SaferSightingOutcome => {
  switch (roll) {
    case 1:
      return { type: "learned", roll };
    default:
      return { type: "no_learn", roll };
  }
};

/**
 * Resolve a sighting, accounting for auto-learn on 5th sighting.
 * The sightingCount is the count *before* this sighting (0-indexed).
 */
export const resolveSighting = (
  sightingType: SightingType,
  roll: D4,
  sightingCount: number,
): SightingEvent => {
  const isAutoLearn = sightingCount + 1 >= AUTO_LEARN_SIGHTING_COUNT;

  if (isAutoLearn) {
    // On 5th sighting, you auto-learn. For perilous, you still face danger.
    if (sightingType === "perilous") {
      const outcome = resolvePerilous(roll);
      // Override: you learn regardless, but can still be killed/wounded
      return { sightingType, outcome, autoLearned: true };
    }
    // Safer auto-learn: you just learn
    return {
      sightingType,
      outcome: { type: "learned", roll },
      autoLearned: true,
    };
  }

  const outcome =
    sightingType === "perilous" ? resolvePerilous(roll) : resolveSafer(roll);

  return { sightingType, outcome, autoLearned: false };
};

/** Check if a sighting outcome means the player learned the weakness */
export const didLearnWeakness = (event: SightingEvent): boolean => {
  if (event.autoLearned) return true;
  const { outcome } = event;
  return (
    outcome.type === "learned" ||
    outcome.type === "unharmed_learned" ||
    outcome.type === "wounded_learned"
  );
};

/** Check if a sighting outcome means the player was wounded */
export const wasWoundedBySighting = (event: SightingEvent): boolean => {
  const { outcome } = event;
  return outcome.type === "wounded_learned" || outcome.type === "wounded_no_learn";
};

/** Check if a sighting outcome means the player was killed */
export const wasKilledBySighting = (event: SightingEvent): boolean =>
  event.outcome.type === "killed";
