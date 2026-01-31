import { map } from "#fp";
import { MAP_SIZE } from "./constants.ts";
import { getLocation, isSamePosition } from "./grid.ts";
import { getValidPlayerMoves } from "./movement.ts";
import type {
  BridgeState,
  CompassDirection,
  GameState,
  LocationState,
  Position,
  TurnEvent,
} from "./types.ts";

const SPECIAL_LABELS: Record<string, string> = {
  mountains: "\u26f0",
  telecom_tower: "\ud83d\udce1",
  nuclear_plant: "\u2622\ufe0f",
  city_hall: "\ud83c\udfe0",
  bridge: "\ud83c\udf09",
  docks: "\u2693",
};

const DESTRUCTION_MARKS = ["", "\u2571", "\u2573", "\u2588"];

const directionArrows: Record<CompassDirection, string> = {
  NW: "\u2196", N: "\u2191", NE: "\u2197",
  W: "\u2190", E: "\u2192",
  SW: "\u2199", S: "\u2193", SE: "\u2198",
};

/** Render the 7x7 grid as an HTML table */
export const renderGrid = (state: GameState): string => {
  const rows = Array.from({ length: MAP_SIZE }, (_, row) => {
    const cells = Array.from({ length: MAP_SIZE }, (_, col) => {
      const pos: Position = { row: row as Position["row"], col: col as Position["col"] };
      const loc = getLocation(state.grid, pos)!;
      return renderCell(loc, state, pos);
    });
    return `<tr>${cells.join("")}</tr>`;
  });
  return `<table class="grid">${rows.join("")}</table>`;
};

const renderCell = (
  loc: LocationState,
  state: GameState,
  pos: Position,
): string => {
  const isPlayer = isSamePosition(state.player.position, pos);
  const isKaiju = isSamePosition(state.kaiju.position, pos);
  const destroyed = loc.destruction >= 3;

  const classes = [
    "cell",
    destroyed ? "destroyed" : "",
    loc.destruction === 1 ? "dmg1" : "",
    loc.destruction === 2 ? "dmg2" : "",
    isPlayer ? "has-player" : "",
    isKaiju ? "has-kaiju" : "",
    loc.special ? `special-${loc.special}` : "",
  ].filter(Boolean).join(" ");

  const contents: string[] = [];

  if (loc.special) {
    contents.push(`<span class="special-icon">${SPECIAL_LABELS[loc.special] ?? ""}</span>`);
  }

  if (destroyed) {
    contents.push(`<span class="destruction-mark">${DESTRUCTION_MARKS[3]}</span>`);
  } else if (loc.destruction > 0) {
    contents.push(`<span class="destruction-mark">${DESTRUCTION_MARKS[loc.destruction]!}</span>`);
  }

  if (isKaiju) {
    contents.push(`<span class="kaiju">K</span>`);
  }
  if (isPlayer) {
    contents.push(`<span class="player">@</span>`);
  }

  if (loc.searchCount > 0) {
    contents.push(`<span class="searched">\u2713</span>`);
  }

  return `<td class="${classes}" data-row="${pos.row}" data-col="${pos.col}">${contents.join("")}</td>`;
};

/** Render the move controls */
export const renderControls = (state: GameState): string => {
  if (state.phase.phase === "victory") {
    return `<div class="controls victory">
      <h2>Victory!</h2>
      <p>You found the military base. The kaiju has been driven off!</p>
      <button type="button" id="new-game">New Game</button>
    </div>`;
  }

  if (state.phase.phase === "defeat") {
    return `<div class="controls defeat">
      <h2>Defeat</h2>
      <p>${deathMessage(state.phase.cause)}</p>
      <button type="button" id="new-game">New Game</button>
    </div>`;
  }

  const bridgeSide = state.bridge.collapsed && "playerSide" in state.bridge
    ? state.bridge.playerSide
    : null;

  const validMoves = getValidPlayerMoves(
    state.player.position,
    state.grid,
    state.bridge.collapsed,
    bridgeSide,
  );

  const validDirs = new Set(map((m: { direction: CompassDirection }) => m.direction)(validMoves));

  const dirButton = (dir: CompassDirection, label: string): string => {
    const disabled = !validDirs.has(dir) ? "disabled" : "";
    return `<button type="button" class="move-btn" data-direction="${dir}" ${disabled}>${label}</button>`;
  };

  const grid = `
    <div class="move-grid">
      ${dirButton("NW", directionArrows.NW)}
      ${dirButton("N", directionArrows.N)}
      ${dirButton("NE", directionArrows.NE)}
      ${dirButton("W", directionArrows.W)}
      <button type="button" class="move-btn hold-btn" data-direction="hold">\u23f8</button>
      ${dirButton("E", directionArrows.E)}
      ${dirButton("SW", directionArrows.SW)}
      ${dirButton("S", directionArrows.S)}
      ${dirButton("SE", directionArrows.SE)}
    </div>`;

  return `<div class="controls">${grid}</div>`;
};

/** Render the status bar */
export const renderStatus = (state: GameState): string => {
  const parts: string[] = [];

  parts.push(`<span class="turn">Turn ${state.turnNumber}</span>`);

  const phaseLabel = state.phase.phase === "finding_kaiju"
    ? "Finding Kaiju"
    : state.phase.phase === "searching_base"
      ? `Searching (${state.player.locationsToSearch} left)`
      : state.phase.phase;
  parts.push(`<span class="phase">${phaseLabel}</span>`);

  parts.push(`<span class="health ${state.player.status}">${state.player.status.toUpperCase()}</span>`);

  const sightingDots = Array.from({ length: 5 }, (_, i) =>
    i < state.player.sightingCount ? "\u25cf" : "\u25cb",
  ).join("");
  parts.push(`<span class="sightings">Sightings: ${sightingDots}</span>`);

  if (state.player.knowsWeakness) {
    parts.push(`<span class="weakness-known">Weakness Known!</span>`);
  }

  if (state.player.luck > 0) {
    parts.push(`<span class="luck">Luck: ${"*".repeat(state.player.luck)}</span>`);
  }

  return `<div class="status-bar">${parts.join("")}</div>`;
};

/** Render the event log for a turn */
export const renderTurnLog = (events: readonly TurnEvent[], turnNumber: number): string => {
  if (events.length === 0) return "";

  const lines = map((e: TurnEvent) => describeEvent(e))(events as TurnEvent[]);
  const content = lines.join("<br>");
  return `<div class="log-entry"><strong>Turn ${turnNumber}:</strong> ${content}</div>`;
};

const describeEvent = (event: TurnEvent): string => {
  switch (event.event) {
    case "wreckage_roll":
      return event.outcome.type === "safe"
        ? `Navigated wreckage safely (rolled ${event.outcome.roll})`
        : `Accident in wreckage! Wounded (rolled ${event.outcome.roll})`;
    case "sighting":
      return describeSighting(event);
    case "search_encounter":
      return event.outcome.type === "escape"
        ? `The kaiju found you but you escaped! (rolled ${event.outcome.roll})`
        : `The kaiju caught and ate you! (rolled ${event.outcome.roll})`;
    case "location_searched":
      return `Searched location (${event.position.row},${event.position.col})`;
    case "destruction":
      return `Destruction at (${event.position.row},${event.position.col}) \u2192 level ${event.newLevel}`;
    case "player_killed":
      return deathMessage(event.cause);
    case "base_found":
      return "You found the secret military base!";
    case "kaiju_flees":
      return "The kaiju is driven south toward the sea!";
    case "bridge_collapsed":
      return "The bridge has collapsed! You're trapped on one side of the map.";
    case "telecom_destroyed":
      return "Telecom tower destroyed! It'll take longer to find the base.";
    case "nuclear_meltdown":
      return "NUCLEAR MELTDOWN! Massive destruction around the power plant!";
    case "city_hall_riots":
      return "City Hall destroyed! Riots cause destruction across the area.";
    case "mountain_home_destroyed":
      return "Your mountain home is destroyed! You're shaken (disadvantage next roll).";
    case "special_triggered":
      return `Special event: ${event.locationType}`;
    case "final_encounter":
      return event.outcome.type === "killed"
        ? `The fleeing kaiju killed you! (rolled ${event.outcome.roll})`
        : `The kaiju passed over you as it fled! (rolled ${event.outcome.roll})`;
  }
};

const describeSighting = (event: { detail: { sightingType: string; outcome: { type: string; roll: number }; autoLearned: boolean } }): string => {
  const { sightingType, outcome, autoLearned } = event.detail;
  const typeLabel = sightingType === "perilous" ? "Perilous sighting" : "Safer sighting";
  const auto = autoLearned ? " (5th sighting - auto-learn!)" : "";

  switch (outcome.type) {
    case "unharmed_learned":
      return `${typeLabel}: You observe the kaiju's weakness, unharmed! (rolled ${outcome.roll})${auto}`;
    case "wounded_learned":
      return `${typeLabel}: You learn the weakness but are wounded! (rolled ${outcome.roll})${auto}`;
    case "wounded_no_learn":
      return `${typeLabel}: Wounded and couldn't learn anything. (rolled ${outcome.roll})`;
    case "killed":
      return `${typeLabel}: The kaiju killed you! (rolled ${outcome.roll})`;
    case "learned":
      return `${typeLabel}: You spot the kaiju's weakness! (rolled ${outcome.roll})${auto}`;
    case "no_learn":
      return `${typeLabel}: Can't get a good enough view. (rolled ${outcome.roll})`;
    default:
      return `${typeLabel}: (rolled ${outcome.roll})`;
  }
};

const deathMessage = (cause: string): string => {
  switch (cause) {
    case "killed_by_kaiju_sighting":
      return "You were killed by the kaiju during a sighting!";
    case "killed_by_kaiju_searching":
      return "The kaiju caught and devoured you while searching!";
    case "killed_by_destruction":
      return "You were killed when your location was destroyed!";
    case "died_of_wounds":
      return "You succumbed to your injuries.";
    case "killed_in_final_encounter":
      return "You were killed by the fleeing kaiju at the last moment!";
    default:
      return "You died.";
  }
};
