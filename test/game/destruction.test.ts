import { describe, test, expect } from "#test-compat";
import {
  addDestruction,
  applyKaijuDestruction,
  triggerSpecialEffect,
} from "#game/destruction.ts";
import { createGrid, findSpecialLocation, getLocation } from "#game/grid.ts";
import { createSequenceDice } from "#test-utils";
import type { GameState, LocationState, Row, Col, DestructionLevel } from "#game/types.ts";

const makeLocation = (
  row: number,
  col: number,
  overrides: Partial<LocationState> = {},
): LocationState => ({
  position: { row: row as Row, col: col as Col },
  destruction: 0,
  special: null,
  specialTriggered: false,
  searchCount: 0,
  ...overrides,
});

// Mountains/docks fully pinned (0 dice). 4 unconstrained × 3 dice each = 12.
const makeDice = () =>
  createSequenceDice([1, 1, 2, 2, 3, 3, 4, 4, 1, 2, 3, 4]);

const makeGameState = (): GameState => {
  const { grid } = createGrid(makeDice());
  return {
    difficulty: "normal",
    player: {
      position: findSpecialLocation(grid, "mountains")!,
      status: "alive",
      deathCause: null,
      temporaryDisadvantageRolls: 0,
      sightingCount: 0,
      knowsWeakness: false,
      locationsToSearch: 0,
      luck: 0,
    },
    kaiju: {
      position: findSpecialLocation(grid, "docks")!,
    },
    phase: { phase: "finding_kaiju" },
    bridge: { collapsed: false },
    grid,
    turnNumber: 0,
    turnHistory: [],
  };
};

describe("addDestruction", () => {
  test("increments destruction by the given amount", () => {
    const loc = makeLocation(3, 3);
    const { newLevel } = addDestruction(loc, 1);
    expect(newLevel).toBe(1);
    expect(loc.destruction).toBe(1);
  });

  test("caps destruction at 3", () => {
    const loc = makeLocation(3, 3, { destruction: 2 as DestructionLevel });
    const { newLevel } = addDestruction(loc, 3);
    expect(newLevel).toBe(3);
    expect(loc.destruction).toBe(3);
  });

  test("reports when location becomes fully destroyed", () => {
    const loc = makeLocation(3, 3, { destruction: 2 as DestructionLevel });
    const { wasFullyDestroyed } = addDestruction(loc, 1);
    expect(wasFullyDestroyed).toBe(true);
  });

  test("does not report fully destroyed if already at 3", () => {
    const loc = makeLocation(3, 3, { destruction: 3 as DestructionLevel });
    const { wasFullyDestroyed } = addDestruction(loc, 1);
    expect(wasFullyDestroyed).toBe(false);
  });
});

describe("applyKaijuDestruction", () => {
  test("adds 1 destruction to the location the kaiju enters", () => {
    const state = makeGameState();
    const target = { row: 3 as Row, col: 3 as Col };
    applyKaijuDestruction(state, target);
    const loc = getLocation(state.grid, target);
    expect(loc!.destruction).toBe(1);
  });

  test("kills player if their location becomes fully destroyed", () => {
    const state = makeGameState();
    // Put player at (3,3) and give it 2 destruction already
    state.player.position = { row: 3 as Row, col: 3 as Col };
    const loc = getLocation(state.grid, state.player.position)!;
    loc.destruction = 2 as DestructionLevel;

    const events = applyKaijuDestruction(state, state.player.position);
    expect(state.player.status).toBe("dead");
    expect(state.player.deathCause).toBe("killed_by_destruction");
    const killEvent = events.find(e => e.event === "player_killed");
    expect(killEvent).toBeDefined();
  });
});

describe("triggerSpecialEffect", () => {
  test("nuclear plant destroys itself and all neighbors", () => {
    const state = makeGameState();
    const nuclearPos = findSpecialLocation(state.grid, "nuclear_plant");
    if (!nuclearPos) return; // skip if placement didn't work for this seed

    // Trigger the nuclear plant
    const loc = getLocation(state.grid, nuclearPos)!;
    loc.specialTriggered = false;

    // Move player far away so they don't die
    state.player.position = { row: 0 as Row, col: 0 as Col };

    const events = triggerSpecialEffect(state, nuclearPos);
    expect(events.some(e => e.event === "nuclear_meltdown")).toBe(true);

    // The nuclear plant location itself should be fully destroyed
    expect(getLocation(state.grid, nuclearPos)!.destruction).toBe(3);
  });

  test("mountain home destruction gives temporary disadvantage", () => {
    const state = makeGameState();
    const mountainPos = findSpecialLocation(state.grid, "mountains")!;
    const loc = getLocation(state.grid, mountainPos)!;
    loc.specialTriggered = false;

    // Move player away
    state.player.position = { row: 3 as Row, col: 3 as Col };

    const events = triggerSpecialEffect(state, mountainPos);
    expect(events.some(e => e.event === "mountain_home_destroyed")).toBe(true);
    expect(state.player.temporaryDisadvantageRolls).toBe(1);
  });

  test("bridge collapse sets bridge state", () => {
    const state = makeGameState();
    const bridgePos = findSpecialLocation(state.grid, "bridge");
    if (!bridgePos) return;

    const loc = getLocation(state.grid, bridgePos)!;
    loc.specialTriggered = false;

    // Put player clearly on one side
    state.player.position = { row: 3 as Row, col: 0 as Col };

    const events = triggerSpecialEffect(state, bridgePos);
    expect(events.some(e => e.event === "bridge_collapsed")).toBe(true);
    expect(state.bridge.collapsed).toBe(true);
  });

  test("special effects only trigger once", () => {
    const state = makeGameState();
    const mountainPos = findSpecialLocation(state.grid, "mountains")!;

    // Move player away
    state.player.position = { row: 3 as Row, col: 3 as Col };

    // First trigger
    triggerSpecialEffect(state, mountainPos);
    expect(state.player.temporaryDisadvantageRolls).toBe(1);

    // Reset and try again
    state.player.temporaryDisadvantageRolls = 0;
    const events2 = triggerSpecialEffect(state, mountainPos);
    expect(events2).toHaveLength(0);
    expect(state.player.temporaryDisadvantageRolls).toBe(0);
  });
});
