import { create } from "zustand";
import type {
  Availability,
  ClubMatch,
  MatchCallup,
  Player,
  TrainingLoad,
  TrainingSession,
  VolleyballEvent,
} from "../domain/types";
import {
  seedCallups,
  seedClubName,
  seedEvents,
  seedMatches,
  seedPlayers,
  seedTrainingSessions,
} from "../domain/mocks";
import * as Callup from "../domain/callup";
import * as PlayerDomain from "../domain/player";

type Store = {
  clubName: string;
  players: Player[];
  matches: ClubMatch[];
  callups: MatchCallup[];
  trainingSessions: TrainingSession[];
  events: VolleyballEvent[];
  addPlayer: (player: Omit<Player, "id" | "aliases">) => void;
  updatePlayer: (id: string, patch: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  addMatch: (match: Omit<ClubMatch, "id">) => void;
  updateMatch: (id: string, patch: Partial<ClubMatch>) => void;
  removeMatch: (id: string) => void;
  setAvailability: (matchId: string, playerId: string, value: Availability) => void;
  togglePlayerInCallup: (matchId: string, playerId: string) => void;
  addTrainingSession: (session: Omit<TrainingSession, "id" | "loads">) => void;
  updateTrainingLoad: (sessionId: string, playerId: string, partial: Partial<TrainingLoad>) => void;
};

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useStore = create<Store>((set) => ({
  clubName: seedClubName,
  players: seedPlayers,
  matches: seedMatches,
  callups: seedCallups,
  trainingSessions: seedTrainingSessions,
  events: seedEvents,

  addPlayer: (player) => {
    PlayerDomain.assertValid(player);
    set((state) => ({
      players: [...state.players, { ...player, id: makeId("p"), aliases: [] }],
    }));
  },

  updatePlayer: (id, patch) =>
    set((state) => ({
      players: state.players.map((p) => {
        if (p.id !== id) return p;
        const merged = { ...p, ...patch };
        PlayerDomain.assertValid(merged);
        return merged;
      }),
    })),

  removePlayer: (id) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== id),
    })),

  addMatch: (match) =>
    set((state) => ({
      matches: [...state.matches, { ...match, id: makeId("m") }],
    })),

  updateMatch: (id, patch) =>
    set((state) => ({
      matches: state.matches.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  removeMatch: (id) =>
    set((state) => ({
      matches: state.matches.filter((m) => m.id !== id),
      callups: state.callups.filter((c) => c.matchId !== id),
    })),

  setAvailability: (matchId, playerId, value) =>
    set((s) => ({ callups: Callup.setAvailability(s.callups, matchId, playerId, value) })),

  togglePlayerInCallup: (matchId, playerId) =>
    set((s) => ({ callups: Callup.togglePlayer(s.callups, matchId, playerId) })),

  addTrainingSession: (session) =>
    set((state) => ({
      trainingSessions: [...state.trainingSessions, { ...session, id: makeId("t"), loads: {} }],
    })),

  updateTrainingLoad: (sessionId, playerId, partial) =>
    set((state) => ({
      trainingSessions: state.trainingSessions.map((s) => {
        if (s.id !== sessionId) return s;
        const current: TrainingLoad = s.loads[playerId] ?? {
          present: false,
          minutes: 0,
          rpe: 0,
          fatigue: 0,
          pain: 0,
        };
        return {
          ...s,
          loads: { ...s.loads, [playerId]: { ...current, ...partial } },
        };
      }),
    })),
}));
