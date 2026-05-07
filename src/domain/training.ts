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
