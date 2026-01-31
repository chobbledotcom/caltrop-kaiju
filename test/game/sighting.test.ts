import { describe, test, expect } from "#test-compat";
import {
  detectSighting,
  resolvePerilous,
  resolveSafer,
  resolveSighting,
  didLearnWeakness,
  wasWoundedBySighting,
  wasKilledBySighting,
} from "#game/sighting.ts";
import { AUTO_LEARN_SIGHTING_COUNT } from "#game/constants.ts";
import type { Position, Row, Col, D4 } from "#game/types.ts";

const pos = (row: number, col: number): Position =>
  ({ row: row as Row, col: col as Col });

describe("detectSighting", () => {
  test("returns perilous when kaiju passes through player square", () => {
    const result = detectSighting(pos(3, 3), [pos(2, 3), pos(3, 3), pos(4, 3)]);
    expect(result).toBe("perilous");
  });

  test("returns perilous when kaiju ends on player square", () => {
    const result = detectSighting(pos(4, 3), [pos(2, 3), pos(3, 3), pos(4, 3)]);
    expect(result).toBe("perilous");
  });

  test("returns safer when kaiju passes through adjacent square", () => {
    const result = detectSighting(pos(3, 4), [pos(1, 3), pos(2, 3), pos(3, 3)]);
    expect(result).toBe("safer");
  });

  test("returns null when kaiju path is far away", () => {
    const result = detectSighting(pos(0, 0), [pos(5, 5), pos(5, 6), pos(6, 6)]);
    expect(result).toBeNull();
  });

  test("perilous takes priority over safer", () => {
    // Path goes through adjacent AND player's square
    const result = detectSighting(pos(3, 3), [pos(3, 2), pos(3, 3), pos(3, 4)]);
    expect(result).toBe("perilous");
  });

  test("returns null for empty kaiju path", () => {
    const result = detectSighting(pos(3, 3), []);
    expect(result).toBeNull();
  });
});

describe("resolvePerilous", () => {
  test("roll 1 = unharmed and learned", () => {
    const outcome = resolvePerilous(1);
    expect(outcome.type).toBe("unharmed_learned");
  });

  test("roll 2 = wounded and learned", () => {
    const outcome = resolvePerilous(2);
    expect(outcome.type).toBe("wounded_learned");
  });

  test("roll 3 = wounded, no learn", () => {
    const outcome = resolvePerilous(3);
    expect(outcome.type).toBe("wounded_no_learn");
  });

  test("roll 4 = killed", () => {
    const outcome = resolvePerilous(4);
    expect(outcome.type).toBe("killed");
  });
});

describe("resolveSafer", () => {
  test("roll 1 = learned", () => {
    const outcome = resolveSafer(1);
    expect(outcome.type).toBe("learned");
  });

  test("roll 2 = no learn", () => {
    expect(resolveSafer(2).type).toBe("no_learn");
  });

  test("roll 3 = no learn", () => {
    expect(resolveSafer(3).type).toBe("no_learn");
  });

  test("roll 4 = no learn", () => {
    expect(resolveSafer(4).type).toBe("no_learn");
  });
});

describe("resolveSighting", () => {
  test("5th sighting auto-learns on safer sighting regardless of roll", () => {
    const event = resolveSighting("safer", 4 as D4, AUTO_LEARN_SIGHTING_COUNT - 1);
    expect(event.autoLearned).toBe(true);
    expect(didLearnWeakness(event)).toBe(true);
  });

  test("5th perilous sighting still rolls for danger but auto-learns", () => {
    const event = resolveSighting("perilous", 4 as D4, AUTO_LEARN_SIGHTING_COUNT - 1);
    expect(event.autoLearned).toBe(true);
    // Roll of 4 on perilous = killed, even on auto-learn
    expect(event.outcome.type).toBe("killed");
  });

  test("sighting before 5th does not auto-learn", () => {
    const event = resolveSighting("safer", 3 as D4, 2);
    expect(event.autoLearned).toBe(false);
    expect(didLearnWeakness(event)).toBe(false);
  });
});

describe("didLearnWeakness", () => {
  test("perilous unharmed_learned = learned", () => {
    const event = resolveSighting("perilous", 1 as D4, 0);
    expect(didLearnWeakness(event)).toBe(true);
  });

  test("perilous wounded_learned = learned", () => {
    const event = resolveSighting("perilous", 2 as D4, 0);
    expect(didLearnWeakness(event)).toBe(true);
  });

  test("perilous wounded_no_learn = not learned", () => {
    const event = resolveSighting("perilous", 3 as D4, 0);
    expect(didLearnWeakness(event)).toBe(false);
  });

  test("safer learned = learned", () => {
    const event = resolveSighting("safer", 1 as D4, 0);
    expect(didLearnWeakness(event)).toBe(true);
  });

  test("safer no_learn = not learned", () => {
    const event = resolveSighting("safer", 2 as D4, 0);
    expect(didLearnWeakness(event)).toBe(false);
  });
});

describe("wasWoundedBySighting", () => {
  test("wounded_learned counts as wounded", () => {
    const event = resolveSighting("perilous", 2 as D4, 0);
    expect(wasWoundedBySighting(event)).toBe(true);
  });

  test("wounded_no_learn counts as wounded", () => {
    const event = resolveSighting("perilous", 3 as D4, 0);
    expect(wasWoundedBySighting(event)).toBe(true);
  });

  test("unharmed_learned is not wounded", () => {
    const event = resolveSighting("perilous", 1 as D4, 0);
    expect(wasWoundedBySighting(event)).toBe(false);
  });

  test("safer sighting never wounds", () => {
    const event = resolveSighting("safer", 1 as D4, 0);
    expect(wasWoundedBySighting(event)).toBe(false);
  });
});

describe("wasKilledBySighting", () => {
  test("perilous roll 4 = killed", () => {
    const event = resolveSighting("perilous", 4 as D4, 0);
    expect(wasKilledBySighting(event)).toBe(true);
  });

  test("perilous roll 1 = not killed", () => {
    const event = resolveSighting("perilous", 1 as D4, 0);
    expect(wasKilledBySighting(event)).toBe(false);
  });

  test("safer sighting never kills", () => {
    const event = resolveSighting("safer", 4 as D4, 0);
    expect(wasKilledBySighting(event)).toBe(false);
  });
});
