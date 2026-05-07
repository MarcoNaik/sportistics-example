import { describe, expect, it } from "bun:test";
import { fromRows, toRows, type CallupRow } from "./callup";
import type { MatchCallup } from "./types";

describe("Callup.fromRows", () => {
  it("returns empty array for empty rows", () => {
    expect(fromRows([])).toEqual([]);
  });

  it("groups rows for one match into one MatchCallup", () => {
    const rows: CallupRow[] = [
      { id: "r1", matchId: "m1", playerId: "p1", availability: "available" },
      { id: "r2", matchId: "m1", playerId: "p2", availability: "pending" },
    ];
    expect(fromRows(rows)).toEqual([
      { matchId: "m1", availability: { p1: "available", p2: "pending" } },
    ]);
  });

  it("groups rows for multiple matches into multiple MatchCallups", () => {
    const rows: CallupRow[] = [
      { id: "r1", matchId: "m1", playerId: "p1", availability: "available" },
      { id: "r2", matchId: "m2", playerId: "p1", availability: "unavailable" },
      { id: "r3", matchId: "m1", playerId: "p2", availability: "maybe" },
    ];
    const result = fromRows(rows);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ matchId: "m1", availability: { p1: "available", p2: "maybe" } });
    expect(result).toContainEqual({ matchId: "m2", availability: { p1: "unavailable" } });
  });

  it("dedupes duplicate (matchId, playerId) tuples last-wins", () => {
    const rows: CallupRow[] = [
      { id: "r1", matchId: "m1", playerId: "p1", availability: "pending" },
      { id: "r2", matchId: "m1", playerId: "p1", availability: "available" },
    ];
    expect(fromRows(rows)).toEqual([
      { matchId: "m1", availability: { p1: "available" } },
    ]);
  });
});

describe("Callup.toRows", () => {
  it("returns empty array for empty availability", () => {
    const callup: MatchCallup = { matchId: "m1", availability: {} };
    expect(toRows(callup)).toEqual([]);
  });

  it("projects each playerId to its own row carrying availability", () => {
    const callup: MatchCallup = {
      matchId: "m1",
      availability: { p1: "available", p2: "pending" },
    };
    const rows = toRows(callup);
    expect(rows).toHaveLength(2);
    expect(rows).toContainEqual({ matchId: "m1", playerId: "p1", availability: "available" });
    expect(rows).toContainEqual({ matchId: "m1", playerId: "p2", availability: "pending" });
  });
});

describe("Callup round-trip", () => {
  it("fromRows(toRows(x)) === [x] for multi-player callup", () => {
    const callup: MatchCallup = {
      matchId: "m1",
      availability: { p1: "available", p2: "maybe", p3: "unavailable" },
    };
    const rows: CallupRow[] = toRows(callup).map((r, i) => ({ id: `r${i}`, ...r }));
    expect(fromRows(rows)).toEqual([callup]);
  });
});
