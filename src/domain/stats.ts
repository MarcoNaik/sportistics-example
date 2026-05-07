import type { Player, PlayerStats, VolleyballEvent } from "./types";

function aggregate(players: Player[], events: VolleyballEvent[]): PlayerStats[] {
  const rows = new Map<string, PlayerStats>();
  players.forEach((player) => {
    rows.set(player.id, {
      playerId: player.id,
      playerName: player.name,
      serves: 0,
      aces: 0,
      serveErrors: 0,
      receptionErrors: 0,
      attacks: 0,
      kills: 0,
      attackErrors: 0,
      blocks: 0,
      digs: 0,
      assists: 0,
      points: 0,
    });
  });

  events.forEach((event) => {
    if (!event.playerId) return;
    const row = rows.get(event.playerId);
    if (!row) return;
    if (event.actionType === "serve") row.serves += 1;
    if (event.actionType === "serve" && event.result === "ace") row.aces += 1;
    if (event.actionType === "serve" && ["error", "out", "net"].includes(event.result)) row.serveErrors += 1;
    if (event.actionType === "reception" && event.result === "error") row.receptionErrors += 1;
    if (event.actionType === "attack") row.attacks += 1;
    if (event.actionType === "attack" && event.result === "kill") row.kills += 1;
    if (event.actionType === "attack" && ["error", "out", "net", "blocked"].includes(event.result)) row.attackErrors += 1;
    if (event.actionType === "block" && event.result === "stuff") row.blocks += 1;
    if (event.actionType === "dig") row.digs += 1;
    if (event.actionType === "assist" || (event.actionType === "set" && event.result === "positive")) row.assists += 1;
    if (event.pointFor === event.teamSide && ["ace", "kill", "stuff", "point"].includes(event.result)) row.points += 1;
  });

  return players.map((p) => rows.get(p.id)!);
}

function hasAnyStat(s: PlayerStats): boolean {
  return (
    s.serves > 0 ||
    s.aces > 0 ||
    s.serveErrors > 0 ||
    s.receptionErrors > 0 ||
    s.attacks > 0 ||
    s.kills > 0 ||
    s.attackErrors > 0 ||
    s.blocks > 0 ||
    s.digs > 0 ||
    s.assists > 0 ||
    s.points > 0
  );
}

function byPointsDescNameAsc(a: PlayerStats, b: PlayerStats): number {
  if (b.points !== a.points) return b.points - a.points;
  return a.playerName.localeCompare(b.playerName);
}

export function topScorers(players: Player[], events: VolleyballEvent[], limit: number): PlayerStats[] {
  return aggregate(players, events).sort(byPointsDescNameAsc).slice(0, limit);
}

export function forMatch(players: Player[], events: VolleyballEvent[], matchId: string): PlayerStats[] {
  const matchEvents = events.filter((e) => e.matchId === matchId);
  return aggregate(players, matchEvents).filter(hasAnyStat).sort(byPointsDescNameAsc);
}

export function season(players: Player[], events: VolleyballEvent[]): PlayerStats[] {
  return aggregate(players, events);
}

export function scoreForMatch(events: VolleyballEvent[], matchId: string): { home: number; away: number } {
  return events
    .filter((e) => e.matchId === matchId)
    .reduce(
      (acc, e) => {
        if (e.pointFor === "home") acc.home += 1;
        if (e.pointFor === "away") acc.away += 1;
        return acc;
      },
      { home: 0, away: 0 },
    );
}

export const actionLabels: Record<string, string> = {
  serve: "Serve",
  reception: "Reception",
  set: "Set",
  attack: "Attack",
  block: "Block",
  dig: "Dig",
  assist: "Assist",
  point: "Point",
  substitution: "Substitution",
  timeout: "Timeout",
  note: "Note",
  unknown: "Uncategorized",
};

export const resultLabels: Record<string, string> = {
  ace: "Ace",
  error: "Error",
  in_play: "In play",
  positive: "Positive",
  perfect: "Perfect",
  kill: "Attack point",
  attempt: "Attempt",
  blocked: "Blocked",
  stuff: "Block point",
  touch: "Touch",
  point: "Point",
  out: "Out",
  net: "Net",
  double: "Double",
  lift: "Lift",
  none: "No result",
  unknown: "Unknown",
};
