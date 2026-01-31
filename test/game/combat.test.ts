import { describe, test, expect } from "#test-compat";
import {
  resolveWreckage,
  applyWound,
  resolveSearchEncounter,
  hasDisadvantage,
  consumeTemporaryDisadvantage,
} from "#game/combat.ts";
import type { PlayerState, Row, Col, D4 } from "#game/types.ts";

const makePlayer = (overrides: Partial<PlayerState> = {}): PlayerState => ({
  position: { row: 3 as Row, col: 3 as Col },
  status: "alive",
  deathCause: null,
  temporaryDisadvantageRolls: 0,
  sightingCount: 0,
  knowsWeakness: false,
  locationsToSearch: 0,
  luck: 0,
  ...overrides,
});

describe("resolveWreckage", () => {
  test("rolls 1-3 are safe", () => {
    expect(resolveWreckage(1 as D4).type).toBe("safe");
    expect(resolveWreckage(2 as D4).type).toBe("safe");
    expect(resolveWreckage(3 as D4).type).toBe("safe");
  });

  test("roll 4 wounds the player", () => {
    expect(resolveWreckage(4 as D4).type).toBe("wounded");
  });
});

describe("applyWound", () => {
  test("alive player becomes wounded", () => {
    const player = makePlayer({ status: "alive" });
    const died = applyWound(player);
    expect(died).toBe(false);
    expect(player.status).toBe("wounded");
  });

  test("wounded player dies from second wound", () => {
    const player = makePlayer({ status: "wounded" });
    const died = applyWound(player);
    expect(died).toBe(true);
    expect(player.status).toBe("dead");
    expect(player.deathCause).toBe("died_of_wounds");
  });
});

describe("resolveSearchEncounter", () => {
  test("roll 1 = escape", () => {
    expect(resolveSearchEncounter(1 as D4).type).toBe("escape");
  });

  test("rolls 2-4 = eaten", () => {
    expect(resolveSearchEncounter(2 as D4).type).toBe("eaten");
    expect(resolveSearchEncounter(3 as D4).type).toBe("eaten");
    expect(resolveSearchEncounter(4 as D4).type).toBe("eaten");
  });
});

describe("hasDisadvantage", () => {
  test("alive player with no temporary disadvantage has no disadvantage", () => {
    expect(hasDisadvantage(makePlayer())).toBe(false);
  });

  test("wounded player has disadvantage", () => {
    expect(hasDisadvantage(makePlayer({ status: "wounded" }))).toBe(true);
  });

  test("player with temporary disadvantage rolls has disadvantage", () => {
    expect(hasDisadvantage(makePlayer({ temporaryDisadvantageRolls: 1 }))).toBe(true);
  });

  test("wounded player with temporary disadvantage still has disadvantage", () => {
    expect(hasDisadvantage(makePlayer({ status: "wounded", temporaryDisadvantageRolls: 1 }))).toBe(true);
  });
});

describe("consumeTemporaryDisadvantage", () => {
  test("decrements temporary disadvantage rolls", () => {
    const player = makePlayer({ temporaryDisadvantageRolls: 2 });
    consumeTemporaryDisadvantage(player);
    expect(player.temporaryDisadvantageRolls).toBe(1);
  });

  test("does not go below 0", () => {
    const player = makePlayer({ temporaryDisadvantageRolls: 0 });
    consumeTemporaryDisadvantage(player);
    expect(player.temporaryDisadvantageRolls).toBe(0);
  });
});
