# Sportistics

A volleyball club tool — manages players, the schedule, match availability, training load, and per-player stats. UI in English; domain types in English. Backend will eventually be Struere; today everything runs against in-memory mocks.

## Language

### Roster

**Player**:
A person on the club's roster. Has a `category` (one of `CATEGORIES`) and a `position` (one of `POSITIONS`). A Player is either **Youth** (categories `U-14`, `U-16`, `U-18`) or **Adult**.
_Avoid_: athlete, member.

**Youth**:
Predicate over a Player, true iff their category is one of the youth categories. A Youth Player must have `guardianName` and `guardianPhone`; this is enforced by `Player.assertValid` at the construction seam.
_Avoid_: minor, junior, u18 (use the typed `CATEGORIES`).

### Schedule

**ClubMatch**:
A scheduled match. Has a `date`, `time`, `opponent`, `location`, `competition`, and a `status` (`scheduled` | `live` | `finished`).
_Avoid_: game, fixture, event (the last is reserved for VolleyballEvent).

### Callups

**MatchCallup**:
Per-match availability roster. A player is in a Callup iff they have an entry in the `availability` map (default `pending` when added). One MatchCallup per ClubMatch.
_Avoid_: lineup, roster (Roster is the full Player list, not the Callup).

**Availability**:
A Player's status for a given Callup: `pending` | `available` | `maybe` | `unavailable`. Absence from the map = not in the Callup at all (distinct from `pending`).
_Avoid_: response, status (overloaded with ClubMatch.status).

**CallupSummary**:
Derived counts over a single MatchCallup — `total`, per-bucket counts, and `hasPending` (any player still pending). Computed via `Callup.summary`.

### Training

**TrainingSession**:
A scheduled or completed training. Has a `date`, `time`, `focus`, `location`, and a `loads` map keyed by player id.
_Avoid_: practice, workout.

**TrainingLoad**:
A single player's load for one TrainingSession: `present`, `minutes`, `rpe` (0–10), `fatigue` (0–10), `pain` (0–10).
_Avoid_: effort, score.

### Match recording

**VolleyballEvent**:
Something that happened in a live match — a serve, attack, block, etc. Has a `matchId`, `actionType`, `result`, and (usually) a `playerId`. Aggregated into PlayerStats.
_Avoid_: action, play, point (the last is one possible `actionType`).

**PlayerStats**:
Per-player aggregated counts (serves, aces, kills, points, etc.) derived from VolleyballEvents. Computed via the `Stats` module (`topScorers`, `forMatch`, `season`).
_Avoid_: scoreboard, totals.

## Relationships

- A **ClubMatch** has zero or one **MatchCallup**.
- A **MatchCallup** holds an **Availability** entry per **Player** in the callup.
- A **TrainingSession** holds a **TrainingLoad** entry per attending **Player**.
- A **VolleyballEvent** belongs to one **ClubMatch** (`matchId`) and references one **Player** (`playerId`).
- **PlayerStats** is derived — never stored — from a set of **VolleyballEvents** scoped to a Player set.

## Example dialogue

> **Dev:** "Before the Sunday **ClubMatch**, the coach wants to message every Player whose **Availability** is still `pending`."
> **Domain expert:** "Right — that's a **CallupSummary** with `hasPending = true`. The agent reads the Callup, finds the pending entries, and pings each Player. If a Player declines, the agent updates their **Availability** to `unavailable` and could call a substitute by toggling another Player into the **MatchCallup** with `pending`."

## Flagged ambiguities

- **"Stats"** — the *type* is `PlayerStats`; the *module* (file `src/domain/stats.ts`) is the queries layer. Don't refer to "the stats" without qualifying.
- **"status"** — appears on both `ClubMatch` (`scheduled | live | finished`) and `Player` (`active | injured | inactive`). Always qualify which.
