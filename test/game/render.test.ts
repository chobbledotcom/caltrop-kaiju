import { describe, test, expect } from "#test-compat";
import { renderGrid } from "#game/render.ts";
import { createGrid, findSpecialLocation } from "#game/grid.ts";
import { createSequenceDice } from "#test-utils";
import type { GameState } from "#game/types.ts";

// Mountains/docks fully pinned (0 dice). 4 unconstrained × 3 dice each = 12.
const makeGridDice = () => [1, 1, 2, 2, 3, 3, 4, 4, 1, 2, 3, 4] as const;

const makeGameState = (): GameState => {
  const dice = createSequenceDice([...makeGridDice()]);
  const { grid } = createGrid(dice);
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
    kaiju: { position: findSpecialLocation(grid, "docks")! },
    phase: { phase: "finding_kaiju" },
    bridge: { collapsed: false },
    grid,
    turnNumber: 0,
    turnHistory: [],
  };
};

describe("renderGrid", () => {
  test("renders player icon for alive player", () => {
    const state = makeGameState();
    const html = renderGrid(state);
    expect(html).toContain('class="player"');
  });

  test("renders skull icon when player is dead", () => {
    const state = makeGameState();
    state.player.status = "dead";
    state.player.deathCause = "killed_by_destruction";
    const html = renderGrid(state);
    expect(html).toContain('class="player-dead"');
    expect(html).not.toContain('class="player"');
  });

  test("renders special location icons", () => {
    const state = makeGameState();
    const html = renderGrid(state);
    expect(html).toContain('class="special-icon"');
  });

  test("renders kaiju icon at kaiju position", () => {
    const state = makeGameState();
    const html = renderGrid(state);
    expect(html).toContain('class="kaiju"');
  });
});
