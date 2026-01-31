import { createRandomDice } from "./dice.ts";
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
import { executeTurn } from "./turn.ts";
import type {
  CompassDirection,
  Difficulty,
  GameState,
  PlayerAction,
} from "./types.ts";

let currentState: GameState | null = null;
const dice = createRandomDice();

const $ = (selector: string): HTMLElement | null =>
  document.querySelector(selector);

const render = (): void => {
  if (!currentState) return;

  const gridEl = $("#grid-container");
  const controlsEl = $("#controls-container");
  const statusEl = $("#status-container");

  if (gridEl) gridEl.innerHTML = renderGrid(currentState);
  if (controlsEl) controlsEl.innerHTML = renderControls(currentState);
  if (statusEl) statusEl.innerHTML = renderStatus(currentState);

  bindMoveButtons();
  bindNewGameButton();
};

const appendLog = (html: string): void => {
  const logEl = $("#log-container");
  if (logEl && html) {
    logEl.innerHTML = html + logEl.innerHTML;
  }
};

const handleMove = (action: PlayerAction): void => {
  if (!currentState || isGameOver(currentState)) return;

  const result = executeTurn(currentState, action, dice);
  saveGame(currentState);

  appendLog(renderTurnLog(result.events, currentState.turnNumber));
  render();
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

const showStartScreen = (): void => {
  const appEl = $("#app");
  if (!appEl) return;

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
};

const startGame = (difficulty: Difficulty): void => {
  clearSavedGame();
  currentState = createGameState(difficulty, dice);
  saveGame(currentState);
  showGameScreen();
};

const continueGame = (): void => {
  currentState = loadGame();
  if (!currentState) {
    showStartScreen();
    return;
  }
  showGameScreen();
};

const showGameScreen = (): void => {
  const appEl = $("#app");
  if (!appEl) return;

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
};

/** Initialize the app */
export const init = (): void => {
  showStartScreen();
};
