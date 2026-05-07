import type { MatchCallup, Availability, Player } from "./types";

export type CallupSummary = {
  total: number;
  available: number;
  maybe: number;
  unavailable: number;
  pending: number;
  hasPending: boolean;
};

export function summary(callups: MatchCallup[], matchId: string): CallupSummary {
  const callup = callups.find((c) => c.matchId === matchId);
  if (!callup) {
    return { total: 0, available: 0, maybe: 0, unavailable: 0, pending: 0, hasPending: false };
  }
  const values = Object.values(callup.availability);
  return {
    total: values.length,
    available: values.filter((v) => v === "available").length,
    maybe: values.filter((v) => v === "maybe").length,
    unavailable: values.filter((v) => v === "unavailable").length,
    pending: values.filter((v) => v === "pending").length,
    hasPending: values.some((v) => v === "pending"),
  };
}

export function availabilityFor(callups: MatchCallup[], matchId: string, playerId: string): Availability | undefined {
  const callup = callups.find((c) => c.matchId === matchId);
  return callup?.availability[playerId];
}

export function rosterFor(callups: MatchCallup[], matchId: string, players: Player[]): Array<{ player: Player; availability: Availability | undefined }> {
  const callup = callups.find((c) => c.matchId === matchId);
  return players.map((player) => ({ player, availability: callup?.availability[player.id] }));
}

export function create(callups: MatchCallup[], matchId: string): MatchCallup[] {
  if (callups.some((c) => c.matchId === matchId)) {
    return callups;
  }
  return [...callups, { matchId, availability: {} }];
}

export function setAvailability(callups: MatchCallup[], matchId: string, playerId: string, value: Availability): MatchCallup[] {
  return callups.map((c) =>
    c.matchId === matchId ? { ...c, availability: { ...c.availability, [playerId]: value } } : c,
  );
}

export function removePlayer(callups: MatchCallup[], matchId: string, playerId: string): MatchCallup[] {
  return callups.map((c) => {
    if (c.matchId !== matchId) return c;
    const nextAvail = { ...c.availability };
    delete nextAvail[playerId];
    return { ...c, availability: nextAvail };
  });
}

export function togglePlayer(callups: MatchCallup[], matchId: string, playerId: string): MatchCallup[] {
  const present = availabilityFor(callups, matchId, playerId) !== undefined;
  return present ? removePlayer(callups, matchId, playerId) : setAvailability(callups, matchId, playerId, "pending");
}

export function removePlayerEverywhere(callups: MatchCallup[], playerId: string): MatchCallup[] {
  return callups.map((c) => {
    if (!(playerId in c.availability)) return c;
    const nextAvail = { ...c.availability };
    delete nextAvail[playerId];
    return { ...c, availability: nextAvail };
  });
}

export type CallupRow = {
  id: string;
  matchId: string;
  playerId: string;
  availability: Availability;
  notes?: string;
};

export function fromRows(rows: CallupRow[]): MatchCallup[] {
  const byMatchId = new Map<string, Record<string, Availability>>();
  for (const row of rows) {
    const existing = byMatchId.get(row.matchId) ?? {};
    existing[row.playerId] = row.availability;
    byMatchId.set(row.matchId, existing);
  }
  return Array.from(byMatchId, ([matchId, availability]) => ({ matchId, availability }));
}

export function toRows(callup: MatchCallup): Array<Omit<CallupRow, "id">> {
  return Object.entries(callup.availability).map(([playerId, availability]) => ({
    matchId: callup.matchId,
    playerId,
    availability,
  }));
}
