import { describe, test, expect, beforeEach } from "#test-compat";
import {
  createGameState,
  saveGame,
  loadGame,
  clearSavedGame,
  hasSavedGame,
  isGameOver,
} from "#game/state.ts";
import { findSpecialLocation } from "#game/grid.ts";
import { createSequenceDice } from "#game/dice.ts";
import { STORY_MODE_LUCK } from "#game/constants.ts";
import type { GameState } from "#game/types.ts";

const makeDice = () =>
  createSequenceDice([1, 1, 2, 2, 3, 3, 4, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4]);

// Mock localStorage for Deno
const storage = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
};

// Install mock before tests
if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });
}

describe("createGameState", () => {
  test("creates a game in finding_kaiju phase", () => {
    const state = createGameState("normal", makeDice());
    expect(state.phase.phase).toBe("finding_kaiju");
  });

  test("player starts at mountains position", () => {
    const state = createGameState("normal", makeDice());
    const mountainsPos = findSpecialLocation(state.grid, "mountains");
    expect(state.player.position).toEqual(mountainsPos);
  });

  test("kaiju starts at docks position", () => {
    const state = createGameState("normal", makeDice());
    const docksPos = findSpecialLocation(state.grid, "docks");
    expect(state.kaiju.position).toEqual(docksPos);
  });

  test("player starts alive with no wounds or sightings", () => {
    const state = createGameState("normal", makeDice());
    expect(state.player.status).toBe("alive");
    expect(state.player.sightingCount).toBe(0);
    expect(state.player.knowsWeakness).toBe(false);
  });

  test("story mode gives player luck points", () => {
    const state = createGameState("story", makeDice());
    expect(state.player.luck).toBe(STORY_MODE_LUCK);
  });

  test("normal mode gives zero luck points", () => {
    const state = createGameState("normal", makeDice());
    expect(state.player.luck).toBe(0);
  });

  test("turn number starts at 0", () => {
    const state = createGameState("normal", makeDice());
    expect(state.turnNumber).toBe(0);
    expect(state.turnHistory).toHaveLength(0);
  });

  test("bridge starts not collapsed", () => {
    const state = createGameState("normal", makeDice());
    expect(state.bridge.collapsed).toBe(false);
  });
});

describe("localStorage persistence", () => {
  beforeEach(() => {
    storage.clear();
  });

  test("saveGame and loadGame round-trip a game state", () => {
    const state = createGameState("normal", makeDice());
    saveGame(state);
    const loaded = loadGame();
    expect(loaded).toEqual(state);
  });

  test("loadGame returns null when no save exists", () => {
    clearSavedGame();
    expect(loadGame()).toBeNull();
  });

  test("clearSavedGame removes the save", () => {
    const state = createGameState("normal", makeDice());
    saveGame(state);
    expect(hasSavedGame()).toBe(true);
    clearSavedGame();
    expect(hasSavedGame()).toBe(false);
    expect(loadGame()).toBeNull();
  });

  test("loadGame returns null for corrupted data", () => {
    storage.set("caltrop-kaiju-game", "not valid json {{{");
    expect(loadGame()).toBeNull();
  });
});

describe("isGameOver", () => {
  test("finding_kaiju phase is not game over", () => {
    const state = createGameState("normal", makeDice());
    expect(isGameOver(state)).toBe(false);
  });

  test("victory is game over", () => {
    const state = createGameState("normal", makeDice());
    state.phase = { phase: "victory" };
    expect(isGameOver(state)).toBe(true);
  });

  test("defeat is game over", () => {
    const state = createGameState("normal", makeDice());
    state.phase = { phase: "defeat", cause: "killed_by_kaiju_sighting" };
    expect(isGameOver(state)).toBe(true);
  });

  test("searching_base phase is not game over", () => {
    const state = createGameState("normal", makeDice());
    state.phase = { phase: "searching_base", extraSearchTurns: 0 };
    expect(isGameOver(state)).toBe(false);
  });
});
