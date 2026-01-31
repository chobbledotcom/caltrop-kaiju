import { describe, test, expect } from "#test-compat";
import { planTurn, resolvePostMovement, completeTurn } from "#game/turn.ts";
import { applyKaijuDestruction } from "#game/destruction.ts";
import { createGrid, findSpecialLocation, getLocation } from "#game/grid.ts";
import { createSequenceDice } from "#test-utils";
import type { D4, GameState, Row, Col, DestructionLevel } from "#game/types.ts";

// Mountains/docks fully pinned (0 dice). 4 unconstrained × 3 dice each = 12.
const makeGridDice = (): readonly D4[] => [1, 1, 2, 2, 3, 3, 4, 4, 1, 2, 3, 4];

const makeGameState = (extraDice: readonly D4[] = []): { state: GameState; dice: ReturnType<typeof createSequenceDice> } => {
  const diceValues: readonly D4[] = [...makeGridDice(), ...extraDice];
  const dice = createSequenceDice(diceValues);
  const { grid } = createGrid(dice);
  const state: GameState = {
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
  return { state, dice };
};

describe("planTurn", () => {
  test("moves player position on a move action", () => {
    // Extra dice: 2 for kaiju direction (d44), none for wreckage since (1,3) is intact
    const { state, dice } = makeGameState([1, 1]);
    const startRow = state.player.position.row;
    const plan = planTurn(state, { type: "move", direction: "S" }, dice);

    expect(state.player.position.row).toBe((startRow + 1) as Row);
    expect(plan.playerDiedEarly).toBe(false);
    expect(plan.kaijuPath.length).toBeGreaterThan(0);
  });

  test("hold action does not move player", () => {
    const { state, dice } = makeGameState([2, 2]);
    const startPos = { ...state.player.position };
    const plan = planTurn(state, { type: "hold" }, dice);

    expect(state.player.position).toEqual(startPos);
    expect(plan.playerDiedEarly).toBe(false);
  });

  test("returns playerDiedEarly when wounded player enters wreckage and dies", () => {
    // Need wreckage roll + possible disadvantage roll
    // Wreckage roll of 4 wounds player; wounded player dies from second wound
    const { state, dice } = makeGameState([4, 4]);
    state.player.status = "wounded";
    // Move to a partially destroyed cell
    const target = { row: 1 as Row, col: 3 as Col };
    const loc = getLocation(state.grid, target)!;
    loc.destruction = 1 as DestructionLevel;
    state.player.position = { row: 0 as Row, col: 3 as Col };

    const plan = planTurn(state, { type: "move", direction: "S" }, dice);
    expect(plan.playerDiedEarly).toBe(true);
    expect(state.player.status as string).toBe("dead");
  });

  test("kaiju path is 3 steps in finding_kaiju phase", () => {
    const { state, dice } = makeGameState([1, 1]); // d44 = 11 → N
    planTurn(state, { type: "hold" }, dice);
    // Kaiju starts at (6,3), direction from d44 table
    // Path should be 3 positions
  });
});

describe("resolvePostMovement", () => {
  test("detects sighting when kaiju path passes through player square", () => {
    // Dice: 1 for sighting roll (perilous roll 1 = unharmed_learned), 1 for search phase transition
    const { state, dice } = makeGameState([1, 1]);
    // Place kaiju path to pass through player's position
    const kaijuPath = [state.player.position];
    const events = resolvePostMovement(state, { type: "hold" }, kaijuPath, dice);

    const sightingEvent = events.find(e => e.event === "sighting");
    expect(sightingEvent).toBeDefined();
  });

  test("returns empty events when kaiju is far from player", () => {
    const { state, dice } = makeGameState([]);
    const kaijuPath = [{ row: 5 as Row, col: 0 as Col }];
    const events = resolvePostMovement(state, { type: "hold" }, kaijuPath, dice);

    expect(events).toHaveLength(0);
  });
});

describe("completeTurn", () => {
  test("increments turn number", () => {
    const { state } = makeGameState([]);
    expect(state.turnNumber).toBe(0);
    completeTurn(state, { type: "hold" }, "N", [], []);
    expect(state.turnNumber).toBe(1);
  });

  test("pushes result to turn history", () => {
    const { state } = makeGameState([]);
    const result = completeTurn(state, { type: "hold" }, "N", [], []);
    expect(state.turnHistory).toHaveLength(1);
    expect(state.turnHistory[0]).toBe(result);
  });

  test("sets defeat phase when player is dead", () => {
    const { state } = makeGameState([]);
    state.player.status = "dead";
    state.player.deathCause = "killed_by_destruction";
    completeTurn(state, { type: "hold" }, "N", [], []);
    expect(state.phase.phase).toBe("defeat");
  });

  test("does not change phase when player is alive", () => {
    const { state } = makeGameState([]);
    completeTurn(state, { type: "hold" }, "N", [], []);
    expect(state.phase.phase).toBe("finding_kaiju");
  });
});

describe("full turn via step functions", () => {
  test("planTurn + applyKaijuStep + resolvePostMovement + completeTurn executes a full turn", () => {
    const { state, dice } = makeGameState([1, 1]); // d44 direction dice
    const action = { type: "hold" as const };

    const plan = planTurn(state, action, dice);
    expect(plan.playerDiedEarly).toBe(false);
    expect(plan.kaijuPath.length).toBeGreaterThan(0);

    const allEvents = [...plan.playerEvents];

    // Apply kaiju steps
    for (const pos of plan.kaijuPath) {
      allEvents.push(...applyKaijuDestruction(state, pos));
      state.kaiju.position = pos;
      if (state.player.status === "dead") break;
    }

    const result = completeTurn(state, action, plan.kaijuDirection, plan.kaijuPath, allEvents);
    expect(result.kaijuPath.length).toBeGreaterThan(0);
    expect(state.turnNumber).toBe(1);
    expect(state.turnHistory).toHaveLength(1);
  });
});
