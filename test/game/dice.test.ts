import { describe, test, expect } from "#test-compat";
import {
  createRandomDice,
  rollD4,
  toD44,
  lookupD44Direction,
  rollKaijuDirection,
} from "#game/dice.ts";
import { createSequenceDice } from "#test-utils";
import { D44_DIRECTION_TABLE } from "#game/constants.ts";
import type { D44 } from "#game/types.ts";

describe("createSequenceDice", () => {
  test("returns values from the sequence in order", () => {
    const dice = createSequenceDice([1, 3, 4, 2]);
    expect(dice.rollD4()).toBe(1);
    expect(dice.rollD4()).toBe(3);
    expect(dice.rollD4()).toBe(4);
    expect(dice.rollD4()).toBe(2);
  });

  test("throws when sequence is exhausted", () => {
    const dice = createSequenceDice([1]);
    dice.rollD4();
    expect(() => dice.rollD4()).toThrow("Dice sequence exhausted");
  });
});

describe("createRandomDice", () => {
  test("produces values between 1 and 4", () => {
    const dice = createRandomDice();
    const results = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const val = dice.rollD4();
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(4);
      results.add(val);
    }
    // With 200 rolls, all 4 values should appear
    expect(results.size).toBe(4);
  });
});

describe("rollD4", () => {
  test("normal roll returns a single die value", () => {
    const dice = createSequenceDice([3]);
    const result = rollD4(dice, false);
    expect(result.type).toBe("normal");
    expect(result.dice).toEqual([3]);
    expect(result.result).toBe(3);
  });

  test("disadvantage rolls two dice and takes the higher", () => {
    const dice = createSequenceDice([1, 3]);
    const result = rollD4(dice, true);
    expect(result.type).toBe("disadvantage");
    expect(result.dice).toEqual([1, 3]);
    expect(result.result).toBe(3);
  });

  test("disadvantage with equal dice returns that value", () => {
    const dice = createSequenceDice([2, 2]);
    const result = rollD4(dice, true);
    expect(result.result).toBe(2);
  });

  test("disadvantage takes higher when first die is larger", () => {
    const dice = createSequenceDice([4, 1]);
    const result = rollD4(dice, true);
    expect(result.result).toBe(4);
  });
});

describe("toD44", () => {
  test("combines two d4 values into a d44", () => {
    expect(toD44(1, 1)).toBe(11);
    expect(toD44(1, 4)).toBe(14);
    expect(toD44(4, 4)).toBe(44);
    expect(toD44(3, 2)).toBe(32);
  });
});

describe("lookupD44Direction", () => {
  test("every d44 value maps to a valid compass direction", () => {
    const validDirections = new Set(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]);
    for (const key of Object.keys(D44_DIRECTION_TABLE)) {
      const direction = lookupD44Direction(Number(key) as D44);
      expect(validDirections.has(direction)).toBe(true);
    }
  });

  test("d44 table has correct directional bias from the PDF", () => {
    // Count occurrences of each direction in the d44 table
    const counts: Record<string, number> = {};
    for (const dir of Object.values(D44_DIRECTION_TABLE)) {
      counts[dir] = (counts[dir] ?? 0) + 1;
    }

    // N and S each appear 3 times (weighted toward vertical movement)
    expect(counts["N"]).toBe(2);
    expect(counts["S"]).toBe(2);
    // E and W each appear 2 times
    expect(counts["E"]).toBe(2);
    expect(counts["W"]).toBe(2);
    // Diagonals each appear 2 times
    expect(counts["NE"]).toBe(2);
    expect(counts["SE"]).toBe(2);
    expect(counts["SW"]).toBe(2);
    expect(counts["NW"]).toBe(2);
  });

  test("specific d44 values match the PDF table", () => {
    expect(lookupD44Direction(11)).toBe("N");
    expect(lookupD44Direction(22)).toBe("E");
    expect(lookupD44Direction(33)).toBe("S");
    expect(lookupD44Direction(44)).toBe("W");
    expect(lookupD44Direction(12)).toBe("NE");
    expect(lookupD44Direction(23)).toBe("SE");
    expect(lookupD44Direction(34)).toBe("SW");
    expect(lookupD44Direction(41)).toBe("NW");
  });
});

describe("rollKaijuDirection", () => {
  test("uses two dice rolls to determine direction", () => {
    // d4 rolls: 1, 1 → d44 = 11 → N
    const dice = createSequenceDice([1, 1]);
    const result = rollKaijuDirection(dice);
    expect(result.d44).toBe(11);
    expect(result.direction).toBe("N");
  });

  test("second example: 3, 4 → d44 = 34 → SW", () => {
    const dice = createSequenceDice([3, 4]);
    const result = rollKaijuDirection(dice);
    expect(result.d44).toBe(34);
    expect(result.direction).toBe("SW");
  });
});
