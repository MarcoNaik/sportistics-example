export type TeamSide = "home" | "away";

export type ActionType =
  | "serve"
  | "reception"
  | "set"
  | "attack"
  | "block"
  | "dig"
  | "assist"
  | "point"
  | "substitution"
  | "timeout"
  | "note"
  | "unknown";

export type ActionResult =
  | "ace"
  | "error"
  | "in_play"
  | "positive"
  | "perfect"
  | "kill"
  | "attempt"
  | "blocked"
  | "stuff"
  | "touch"
  | "point"
  | "out"
  | "net"
  | "double"
  | "lift"
  | "none"
  | "unknown";

import type { PlayerCategory, PlayerPosition } from "./player";

export interface Player {
  id: string;
  name: string;
  number: string;
  aliases: string[];
  position: PlayerPosition;
  category?: PlayerCategory;
  status?: "active" | "injured" | "inactive";
  phone?: string;
  guardianName?: string;
  guardianPhone?: string;
  notes?: string;
}

export interface VolleyballEvent {
  id: string;
  sequence: number;
  createdAt: string;
  matchId: string;
  teamSide: TeamSide;
  playerId?: string;
  playerName?: string;
  actionType: ActionType;
  result: ActionResult;
  pointFor?: TeamSide;
  source: "voice" | "manual";
  rawTranscript?: string;
  notes?: string;
}

export interface ClubMatch {
  id: string;
  date: string;
  time: string;
  opponent: string;
  location: string;
  competition: string;
  status: "scheduled" | "live" | "finished";
  notes?: string;
}

export type Availability = "pending" | "available" | "unavailable" | "maybe";

export interface MatchCallup {
  matchId: string;
  availability: Record<string, Availability>;
}

export interface TrainingLoad {
  present: boolean;
  minutes: number;
  rpe: number;
  fatigue: number;
  pain: number;
  notes?: string;
}

export interface TrainingSession {
  id: string;
  date: string;
  time: string;
  focus: string;
  location: string;
  loads: Record<string, TrainingLoad>;
  notes?: string;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  serves: number;
  aces: number;
  serveErrors: number;
  receptionErrors: number;
  attacks: number;
  kills: number;
  attackErrors: number;
  blocks: number;
  digs: number;
  assists: number;
  points: number;
}
