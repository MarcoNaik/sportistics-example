import { describe, expect, it } from "bun:test";
import { fromRow, toRow, type TrainingSessionRow } from "./training";
import type { TrainingSession } from "./types";

const baseRow = {
  id: "s1",
  date: "2026-05-02",
  time: "18:00",
  focus: "blocking",
  location: "Gym A",
};

describe("Training.fromRow", () => {
  it("returns empty Record for empty loads array", () => {
    const row: TrainingSessionRow = { ...baseRow, loads: [] };
    expect(fromRow(row).loads).toEqual({});
  });

  it("builds Record with all entries when playerIds are unique", () => {
    const row: TrainingSessionRow = {
      ...baseRow,
      loads: [
        { playerId: "p1", present: true, minutes: 60, rpe: 5, fatigue: 4, pain: 0 },
        { playerId: "p2", present: false, minutes: 0, rpe: 0, fatigue: 0, pain: 0 },
      ],
    };
    const session = fromRow(row);
    expect(session.loads.p1).toEqual({ present: true, minutes: 60, rpe: 5, fatigue: 4, pain: 0 });
    expect(session.loads.p2).toEqual({ present: false, minutes: 0, rpe: 0, fatigue: 0, pain: 0 });
  });

  it("dedupes duplicate playerIds last-wins", () => {
    const row: TrainingSessionRow = {
      ...baseRow,
      loads: [
        { playerId: "p1", present: false, minutes: 0, rpe: 0, fatigue: 0, pain: 0 },
        { playerId: "p1", present: true, minutes: 90, rpe: 7, fatigue: 6, pain: 1 },
      ],
    };
    expect(fromRow(row).loads.p1).toEqual({ present: true, minutes: 90, rpe: 7, fatigue: 6, pain: 1 });
  });

  it("carries notes through on session and load", () => {
    const row: TrainingSessionRow = {
      ...baseRow,
      loads: [{ playerId: "p1", present: true, minutes: 60, rpe: 5, fatigue: 4, pain: 0, notes: "tweak" }],
      notes: "session ok",
    };
    const session = fromRow(row);
    expect(session.notes).toBe("session ok");
    expect(session.loads.p1.notes).toBe("tweak");
  });
});

describe("Training.toRow", () => {
  it("returns empty array for empty Record", () => {
    const session: TrainingSession = { ...baseRow, loads: {} };
    expect(toRow(session).loads).toEqual([]);
  });

  it("projects Record to one entry per key", () => {
    const session: TrainingSession = {
      ...baseRow,
      loads: {
        p1: { present: true, minutes: 60, rpe: 5, fatigue: 4, pain: 0 },
        p2: { present: false, minutes: 0, rpe: 0, fatigue: 0, pain: 0 },
      },
    };
    const row = toRow(session);
    expect(row.loads).toHaveLength(2);
    expect(row.loads).toContainEqual({ playerId: "p1", present: true, minutes: 60, rpe: 5, fatigue: 4, pain: 0 });
    expect(row.loads).toContainEqual({ playerId: "p2", present: false, minutes: 0, rpe: 0, fatigue: 0, pain: 0 });
  });
});

describe("Training round-trip", () => {
  it("fromRow(toRow(x)) === x for multi-player session", () => {
    const session: TrainingSession = {
      ...baseRow,
      loads: {
        p1: { present: true, minutes: 60, rpe: 5, fatigue: 4, pain: 0, notes: "good" },
        p2: { present: false, minutes: 0, rpe: 0, fatigue: 0, pain: 0 },
        p3: { present: true, minutes: 45, rpe: 6, fatigue: 5, pain: 2 },
      },
      notes: "wrap-up",
    };
    expect(fromRow(toRow(session))).toEqual(session);
  });
});
