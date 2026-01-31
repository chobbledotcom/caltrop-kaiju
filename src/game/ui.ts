import { lazyRef } from "#fp";
import { createRandomDice } from "./dice.ts";
import { applyKaijuDestruction } from "./destruction.ts";
import {
  renderControls,
  renderGrid,
  renderStatus,
  renderTurnLog,
} from "./render.ts";
import {
  clearSavedGame,
  createGameState,
  hasSavedGame,
  isGameOver,
  loadGame,
  saveGame,
} from "./state.ts";
import { planTurn, resolvePostMovement, completeTurn } from "./turn.ts";
import type {
  CompassDirection,
  Difficulty,
  GameState,
  PlayerAction,
  TurnEvent,
} from "./types.ts";

const KAIJU_STEP_DELAY = 300;

const [getState, setState] = lazyRef<GameState | null>(() => null);
const [getAnimating, setAnimating] = lazyRef<boolean>(() => false);
const dice = createRandomDice();

const $ = (selector: string): HTMLElement | null =>
  document.querySelector(selector);

const animationPause = (ms: number): Promise<void> =>
  new Promise((resolve) => { setTimeout(resolve, ms); });

/** Run a callback with the #app element if it exists */
const withAppEl = (fn: (el: HTMLElement) => void): void => {
  const appEl = $("#app");
  if (appEl) fn(appEl);
};

const render = (): void => {
  const state = getState();
  if (!state) return;

  const gridEl = $("#grid-container");
  const controlsEl = $("#controls-container");
  const statusEl = $("#status-container");

  if (gridEl) gridEl.innerHTML = renderGrid(state);
  if (controlsEl) controlsEl.innerHTML = renderControls(state);
  if (statusEl) statusEl.innerHTML = renderStatus(state);

  bindMoveButtons();
  bindNewGameButton();
};

const appendLog = (html: string): void => {
  const logEl = $("#log-container");
  if (logEl && html) {
    logEl.innerHTML = html + logEl.innerHTML;
  }
};

const handleMove = async (action: PlayerAction): Promise<void> => {
  const state = getState();
  if (!state || isGameOver(state) || getAnimating()) return;

  setAnimating(true);
  try {
    const plan = planTurn(state, action, dice);
    const allEvents: TurnEvent[] = [...plan.playerEvents];

    if (!plan.playerDiedEarly) {
      // Animate kaiju movement step by step
      for (const pos of plan.kaijuPath) {
        await animationPause(KAIJU_STEP_DELAY);
        const stepEvents = applyKaijuDestruction(state, pos);
        allEvents.push(...stepEvents);
        state.kaiju.position = pos;
        render();
        if (state.player.status === "dead") break;
      }

      if (state.player.status !== "dead") {
        const postEvents = resolvePostMovement(state, action, plan.kaijuPath, dice);
        allEvents.push(...postEvents);
      }
    }

    const result = completeTurn(state, action, plan.kaijuDirection, plan.kaijuPath, allEvents);
    saveGame(state);
    appendLog(renderTurnLog(result.events, state.turnNumber));
    render();
  } finally {
    setAnimating(false);
  }
};

const bindMoveButtons = (): void => {
  const buttons = document.querySelectorAll<HTMLButtonElement>(".move-btn");
  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      const dir = btn.dataset.direction;
      if (!dir) return;

      if (dir === "hold") {
        handleMove({ type: "hold" });
      } else {
        handleMove({
          type: "move",
          direction: dir as CompassDirection,
        });
      }
    });
  }
};

const bindNewGameButton = (): void => {
  const btn = $("#new-game") as HTMLButtonElement | null;
  if (btn) {
    btn.addEventListener("click", () => showStartScreen());
  }
};

const showStartScreen = (): void => withAppEl((appEl) => {
  const hasSave = hasSavedGame();

  appEl.innerHTML = `
    <div class="start-screen">
      <h1>Caltrop Kaiju!</h1>
      <p>A kaiju has arrived at the docks. Find its weakness, then locate the secret military base to save the city!</p>
      <div class="start-options">
        <button type="button" id="start-normal">New Game (Normal)</button>
        <button type="button" id="start-story">New Game (Story Mode - 3 Luck)</button>
        ${hasSave ? '<button type="button" id="continue-game">Continue Saved Game</button>' : ""}
      </div>
    </div>`;

  $("#start-normal")?.addEventListener("click", () => startGame("normal"));
  $("#start-story")?.addEventListener("click", () => startGame("story"));
  $("#continue-game")?.addEventListener("click", () => continueGame());
});

const startGame = (difficulty: Difficulty): void => {
  clearSavedGame();
  const state = createGameState(difficulty, dice);
  setState(state);
  saveGame(state);
  showGameScreen();
};

const continueGame = (): void => {
  const loaded = loadGame();
  setState(loaded);
  if (!loaded) {
    showStartScreen();
    return;
  }
  showGameScreen();
};

const showGameScreen = (): void => withAppEl((appEl) => {
  appEl.innerHTML = `
    <div class="game-screen">
      <div id="status-container"></div>
      <div class="game-layout">
        <div id="grid-container"></div>
        <div class="side-panel">
          <div id="controls-container"></div>
          <div id="log-container" class="log"></div>
        </div>
      </div>
    </div>`;

  render();
});

/** Initialize the app */
export const init = (): void => {
  showStartScreen();
};
