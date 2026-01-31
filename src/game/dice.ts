import { D44_DIRECTION_TABLE } from "./constants.ts";
import type {
  CompassDirection,
  D4,
  D44,
  DiceProvider,
  DiceRoll,
} from "./types.ts";

/** Create a DiceProvider using Math.random */
export const createRandomDice = (): DiceProvider => ({
  rollD4: (): D4 => (Math.floor(Math.random() * 4) + 1) as D4,
});

/** Create a DiceProvider that returns values from a predetermined sequence */
export const createSequenceDice = (sequence: readonly D4[]): DiceProvider => {
  let index = 0;
  return {
    rollD4: (): D4 => {
      if (index >= sequence.length) {
        throw new Error(
          `Dice sequence exhausted after ${sequence.length} rolls`,
        );
      }
      return sequence[index++]!;
    },
  };
};

/** Roll a single d4, applying disadvantage if needed */
export const rollD4 = (
  dice: DiceProvider,
  disadvantage: boolean,
): DiceRoll => {
  if (disadvantage) {
    const a = dice.rollD4();
    const b = dice.rollD4();
    return {
      type: "disadvantage",
      dice: [a, b],
      result: Math.max(a, b) as D4,
    };
  }
  const value = dice.rollD4();
  return { type: "normal", dice: [value], result: value };
};

/** Combine two d4 rolls into a d44 value */
export const toD44 = (first: D4, second: D4): D44 =>
  (first * 10 + second) as D44;

/** Look up a kaiju compass direction from a d44 roll */
export const lookupD44Direction = (value: D44): CompassDirection =>
  D44_DIRECTION_TABLE[value];

/** Roll 2d4 and return the kaiju's compass direction */
export const rollKaijuDirection = (
  dice: DiceProvider,
): { direction: CompassDirection; d44: D44 } => {
  const first = dice.rollD4();
  const second = dice.rollD4();
  const d44 = toD44(first, second);
  return { direction: lookupD44Direction(d44), d44 };
};
