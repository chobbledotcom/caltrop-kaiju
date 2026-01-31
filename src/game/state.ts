import { STORY_MODE_LUCK } from "./constants.ts";
import { createGrid, findSpecialLocation } from "./grid.ts";
import type {
  Difficulty,
  DiceProvider,
  GameState,
} from "./types.ts";

const STORAGE_KEY = "caltrop-kaiju-game";

/** Create a new game state with randomly placed locations */
export const createGameState = (
  difficulty: Difficulty,
  dice: DiceProvider,
): GameState => {
  const { grid } = createGrid(dice);

  const mountainsPos = findSpecialLocation(grid, "mountains");
  const docksPos = findSpecialLocation(grid, "docks");

  if (!mountainsPos || !docksPos) {
    throw new Error("Failed to place mountains or docks");
  }

  return {
    difficulty,
    player: {
      position: mountainsPos,
      status: "alive",
      deathCause: null,
      temporaryDisadvantageRolls: 0,
      sightingCount: 0,
      knowsWeakness: false,
      locationsToSearch: 0,
      luck: difficulty === "story" ? STORY_MODE_LUCK : 0,
    },
    kaiju: {
      position: docksPos,
    },
    phase: { phase: "finding_kaiju" },
    bridge: { collapsed: false },
    grid,
    turnNumber: 0,
    turnHistory: [],
  };
};

/** Save game state to localStorage */
export const saveGame = (state: GameState): void => {
  const json = JSON.stringify(state);
  localStorage.setItem(STORAGE_KEY, json);
};

/** Load game state from localStorage, returns null if none exists */
export const loadGame = (): GameState | null => {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return null;

  try {
    return JSON.parse(json) as GameState;
  } catch {
    return null;
  }
};

/** Clear saved game from localStorage */
export const clearSavedGame = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/** Check if a saved game exists */
export const hasSavedGame = (): boolean =>
  localStorage.getItem(STORAGE_KEY) !== null;

/** Check if the game is over */
export const isGameOver = (state: GameState): boolean =>
  state.phase.phase === "victory" || state.phase.phase === "defeat";
