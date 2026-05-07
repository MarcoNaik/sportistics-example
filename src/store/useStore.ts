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
import * as Callup from "../domain/callup";
import * as PlayerDomain from "../domain/player";
import * as Training from "../domain/training";
import { struere } from "../lib/struere";

type Status = "idle" | "loading" | "ready" | "error";

type Store = {
  clubName: string;
  status: Status;
  error: string | null;
  players: Player[];
  matches: ClubMatch[];
  callups: MatchCallup[];
  trainingSessions: TrainingSession[];
  events: VolleyballEvent[];
  loadAll: () => Promise<void>;
  addPlayer: (player: Omit<Player, "id" | "aliases">) => Promise<void>;
  updatePlayer: (id: string, partial: Partial<Omit<Player, "id">>) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  addMatch: (match: Omit<ClubMatch, "id">) => Promise<void>;
  updateMatch: (id: string, partial: Partial<Omit<ClubMatch, "id">>) => Promise<void>;
  removeMatch: (id: string) => Promise<void>;
  setAvailability: (matchId: string, playerId: string, value: Availability) => Promise<void>;
  removeFromCallup: (matchId: string, playerId: string) => Promise<void>;
  togglePlayerInCallup: (matchId: string, playerId: string) => Promise<void>;
  addTrainingSession: (session: Omit<TrainingSession, "id" | "loads">) => Promise<void>;
  updateTraining: (id: string, partial: Partial<Omit<TrainingSession, "id">>) => Promise<void>;
  removeTraining: (id: string) => Promise<void>;
  updateTrainingLoad: (sessionId: string, playerId: string, partial: Partial<TrainingLoad>) => Promise<void>;
  addEvent: (event: Omit<VolleyballEvent, "id">) => Promise<void>;
  removeEvent: (id: string) => Promise<void>;
};

export const useStore = create<Store>((set, get) => ({
  clubName: "Sporti Volley Club",
  status: "idle",
  error: null,
  players: [],
  matches: [],
  callups: [],
  trainingSessions: [],
  events: [],

  loadAll: async () => {
    set({ status: "loading", error: null });
    try {
      const [players, matches, callups, trainingSessions, events] = await Promise.all([
        struere.player.list(),
        struere.clubMatch.list(),
        struere.callup.list(),
        struere.trainingSession.list(),
        struere.volleyballEvent.list(),
      ]);
      set({ players, matches, callups, trainingSessions, events, status: "ready", error: null });
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err.message : String(err) });
    }
  },

  addPlayer: async (player) => {
    PlayerDomain.assertValid(player);
    const created = await struere.player.create({ ...player, aliases: [] });
    set((state) => ({ players: [...state.players, created] }));
  },

  updatePlayer: async (id, partial) => {
    const existing = get().players.find((p) => p.id === id);
    if (!existing) throw new Error(`Player not found: ${id}`);
    const merged = { ...existing, ...partial };
    PlayerDomain.assertValid(merged);
    const updated = await struere.player.update(id, partial);
    set((state) => ({ players: state.players.map((p) => (p.id === id ? updated : p)) }));
  },

  removePlayer: async (id) => {
    const state = get();
    await Promise.all([
      struere.callup.removeForPlayer(id),
      ...Training.removePlayerEverywhere(state.trainingSessions, id)
        .filter((s, i) => s !== state.trainingSessions[i])
        .map((s) => struere.trainingSession.update(s.id, s)),
      struere.player.remove(id),
    ]);
    set({
      players: state.players.filter((p) => p.id !== id),
      callups: Callup.removePlayerEverywhere(state.callups, id),
      trainingSessions: Training.removePlayerEverywhere(state.trainingSessions, id),
    });
  },

  addMatch: async (match) => {
    const created = await struere.clubMatch.create(match);
    set((state) => ({
      matches: [...state.matches, created],
      callups: Callup.create(state.callups, created.id),
    }));
  },

  updateMatch: async (id, partial) => {
    const updated = await struere.clubMatch.update(id, partial);
    set((state) => ({ matches: state.matches.map((m) => (m.id === id ? updated : m)) }));
  },

  removeMatch: async (id) => {
    await struere.callup.removeForMatch(id);
    await struere.clubMatch.remove(id);
    set((state) => ({
      matches: state.matches.filter((m) => m.id !== id),
      callups: state.callups.filter((c) => c.matchId !== id),
    }));
  },

  setAvailability: async (matchId, playerId, value) => {
    await struere.callup.setAvailability(matchId, playerId, value);
    set((state) => ({
      callups: Callup.setAvailability(state.callups, matchId, playerId, value),
    }));
  },

  removeFromCallup: async (matchId, playerId) => {
    await struere.callup.removeEntry(matchId, playerId);
    set((state) => ({
      callups: Callup.removePlayer(state.callups, matchId, playerId),
    }));
  },

  togglePlayerInCallup: async (matchId, playerId) => {
    const present = Callup.availabilityFor(get().callups, matchId, playerId) !== undefined;
    if (present) {
      await struere.callup.removeEntry(matchId, playerId);
    } else {
      await struere.callup.setAvailability(matchId, playerId, "pending");
    }
    set((state) => ({
      callups: Callup.togglePlayer(state.callups, matchId, playerId),
    }));
  },

  addTrainingSession: async (session) => {
    const created = await struere.trainingSession.create({ ...session, loads: {} });
    set((state) => ({ trainingSessions: [...state.trainingSessions, created] }));
  },

  updateTraining: async (id, partial) => {
    const existing = get().trainingSessions.find((s) => s.id === id);
    if (!existing) throw new Error(`TrainingSession not found: ${id}`);
    const full: TrainingSession = { ...existing, ...partial, id };
    const updated = await struere.trainingSession.update(id, full);
    set((state) => ({
      trainingSessions: state.trainingSessions.map((s) => (s.id === id ? updated : s)),
    }));
  },

  removeTraining: async (id) => {
    await struere.trainingSession.remove(id);
    set((state) => ({
      trainingSessions: state.trainingSessions.filter((s) => s.id !== id),
    }));
  },

  updateTrainingLoad: async (sessionId, playerId, partial) => {
    const next = Training.setLoad(get().trainingSessions, sessionId, playerId, partial);
    const updatedSession = next.find((s) => s.id === sessionId);
    if (!updatedSession) throw new Error(`TrainingSession not found: ${sessionId}`);
    const persisted = await struere.trainingSession.update(sessionId, updatedSession);
    set((state) => ({
      trainingSessions: state.trainingSessions.map((s) => (s.id === sessionId ? persisted : s)),
    }));
  },

  addEvent: async (event) => {
    const created = await struere.volleyballEvent.create(event);
    set((state) => ({ events: [...state.events, created] }));
  },

  removeEvent: async (id) => {
    await struere.volleyballEvent.remove(id);
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
  },
}));
