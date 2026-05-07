import type { TrainingSession, TrainingLoad } from "./types";

export const DEFAULT_LOAD: TrainingLoad = {
  present: false,
  minutes: 0,
  rpe: 0,
  fatigue: 0,
  pain: 0,
};

export function loadFor(sessions: TrainingSession[], sessionId: string, playerId: string): TrainingLoad {
  const session = sessions.find((s) => s.id === sessionId);
  const entry = session?.loads[playerId];
  if (!entry) return { ...DEFAULT_LOAD };
  return entry;
}

export function presentCount(session: TrainingSession): number {
  return Object.values(session.loads).filter((l) => l.present).length;
}

export function setLoad(
  sessions: TrainingSession[],
  sessionId: string,
  playerId: string,
  partial: Partial<TrainingLoad>,
): TrainingSession[] {
  return sessions.map((s) => {
    if (s.id !== sessionId) return s;
    const current = s.loads[playerId] ?? DEFAULT_LOAD;
    return { ...s, loads: { ...s.loads, [playerId]: { ...current, ...partial } } };
  });
}

export function removePlayerEverywhere(sessions: TrainingSession[], playerId: string): TrainingSession[] {
  return sessions.map((s) => {
    if (!(playerId in s.loads)) return s;
    const nextLoads = { ...s.loads };
    delete nextLoads[playerId];
    return { ...s, loads: nextLoads };
  });
}

export type TrainingSessionRow = {
  id: string;
  date: string;
  time: string;
  focus: string;
  location: string;
  loads: Array<{ playerId: string; present: boolean; minutes: number; rpe: number; fatigue: number; pain: number; notes?: string }>;
  notes?: string;
};

export function fromRow(row: TrainingSessionRow): TrainingSession {
  const loads: Record<string, TrainingLoad> = {};
  for (const entry of row.loads) {
    const load: TrainingLoad = {
      present: entry.present,
      minutes: entry.minutes,
      rpe: entry.rpe,
      fatigue: entry.fatigue,
      pain: entry.pain,
    };
    if (entry.notes !== undefined) load.notes = entry.notes;
    loads[entry.playerId] = load;
  }
  const session: TrainingSession = {
    id: row.id,
    date: row.date,
    time: row.time,
    focus: row.focus,
    location: row.location,
    loads,
  };
  if (row.notes !== undefined) session.notes = row.notes;
  return session;
}

export function toRow(session: TrainingSession): TrainingSessionRow {
  const loads = Object.entries(session.loads).map(([playerId, load]) => {
    const entry: { playerId: string; present: boolean; minutes: number; rpe: number; fatigue: number; pain: number; notes?: string } = {
      playerId,
      present: load.present,
      minutes: load.minutes,
      rpe: load.rpe,
      fatigue: load.fatigue,
      pain: load.pain,
    };
    if (load.notes !== undefined) entry.notes = load.notes;
    return entry;
  });
  const row: TrainingSessionRow = {
    id: session.id,
    date: session.date,
    time: session.time,
    focus: session.focus,
    location: session.location,
    loads,
  };
  if (session.notes !== undefined) row.notes = session.notes;
  return row;
}
