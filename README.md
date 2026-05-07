# Sportistics — Volleyball Coach PWA + 4 Struere Agents
Workshop project for HACK@LATAM and the canonical Voice Agent Cookbook reference.

## What this is

An everyday volleyball-club tool (roster, schedule, callups, training-load, live events, per-player stats) that today runs on in-memory mocks. The workshop walks you through replacing the mocks with a Struere-powered backend: 5 entity types, 4 agents, multi-channel orchestration (chat widget, WhatsApp inbound, voice outbound, weekly email digest). English UI strings, English domain types. This branch (`main`) is the **starting point** — the PWA on mocks. By the end of the three prompts you reach the same state as the `complete-integration` reference branch, which mirrors the [Struere Voice Agent Cookbook](https://docs.struere.dev/integrations/voice-cookbook).

## Branches

| Branch | Purpose |
|---|---|
| `main` | Workshop starting state. PWA running on in-memory mocks, no Struere. Clone this and run Prompt 1, Prompt 2, Prompt 3 in order. |
| `complete-integration` | Reference end state after running all 3 prompts: 5 entity types, 4 agents, chat widget wired, cron + WhatsApp + voice + email orchestration. Three commits on top of `main`, one per prompt. |

The three prompts below are what you paste into Claude Code at each step. Your live result won't match `complete-integration` byte-for-byte, but it should have the same features.

## Quick start

```bash
git clone https://github.com/MarcoNaik/sportistics-example.git
cd sportistics-example
bun install
bun run dev    # PWA boots on mocks at http://localhost:5173
```

You land on `main` — the PWA running on in-memory mocks. Add a Player, Match, or Training Session through the UI; everything works against the mock store. Then run **Prompt 1** below to bootstrap Struere.

## Prerequisites & accounts to create

- [ ] **Bun ≥ 1.2** — https://bun.sh — never npm in this repo.
- [ ] **Struere account + organization (Pro plan for 4+ agents)** — https://struere.dev
- [ ] **Twilio account + outbound-capable phone number** — https://twilio.com — **(only needed for the live voice agent demo; you can complete the workshop without it)**
- [ ] **Meta WhatsApp Business + Kapso connection** — https://kapso.io — **(only needed for the live WhatsApp agent demo)**

That's it. Struere provides email and the Realtime model internally.

## Setup

```bash
git clone https://github.com/MarcoNaik/sportistics-example.git
cd sportistics-example
bun install
bun run dev    # PWA boots on mocks at http://localhost:5173
```

To kick off the workshop, open Claude Code in the repo and paste **Prompt 1** below. The prompt installs the Struere CLI, logs you in, initializes the project, and commits its work.

## The three prompts

These are AI-instruction prompts you copy-paste into Claude Code (with the `struere-developer` skill loaded) at the start of a working session. The agent does the rest. The prompts defer to https://docs.struere.dev for canonical patterns — they give the volleyball-specific context but assume the implementing agent has read the cookbook before writing voice-agent code.

> **Required reading before running these prompts.** Voice agents → https://docs.struere.dev/integrations/voice-cookbook ; platform gotchas (filter syntax, soft-delete, closed schema) → https://docs.struere.dev/platform/gotchas ; per-integration footguns are on each integration's page. Voice failure modes specifically: https://docs.struere.dev/integrations/voice#footguns.

---

### **Prompt 1 — Struere setup**

> Run from `main`. The prompt commits its own work at the end.
> Time: ~2 min.

```
Set up a Struere project (https://struere.dev) — the platform for defining AI agents, data types, roles, and automations in TypeScript. Run these in order; if any step fails, show the error and a fix.

1. Ensure bun is on PATH:
     export PATH="$HOME/.bun/bin:$PATH"
   If `bun --version` still fails: `curl -fsSL https://bun.sh/install | bash`.

2. Install the CLI: `bun install -g struere`.

3. Log in (browser opens — wait for me):
     struere logout
     struere login

4. Initialize: `struere init`. Pause when it asks me to pick an organization. After init: `struere pull`.

5. Install the developer skill: `bunx skills add MarcoNaik/struere-skill --all --yes`.

6. List the new files (`ls struere/`) and confirm `struere/struere.json` exists with the org I picked.

7. Commit: `git add -A && git commit -m "chore: bootstrap Struere project"`.

Docs: https://docs.struere.dev/llms.txt
```

---

### **Prompt 2 — Define entities and wire the SPA**

> Run after Prompt 1's commit. The prompt commits its own work at the end.
> Time: ~5 min.

```
Build the storage layer of Sportistics on Struere. The Vite + React + Zustand frontend runs on mocks today; after this prompt, the SPA reads and writes through Struere. The `struere-developer` skill at `.claude/skills/struere-developer` is the SDK source of truth — consult it for `defineData`, `entity.query`, and CLI workflow. Don't duplicate skill content; reference it. SDK gotchas: https://docs.struere.dev/platform/gotchas.

Read first to ground yourself:
- `CONTEXT.md` (domain glossary — Player, ClubMatch, MatchCallup, TrainingSession, VolleyballEvent)
- `docs/adr/0001-callup-availability-as-source-of-truth.md` (in-memory MatchCallup keeps its `availability` map shape — do not normalize it inside the frontend)
- `src/domain/types.ts`, `src/domain/callup.ts`, `src/domain/training.ts`, `src/domain/player.ts`
- `src/store/useStore.ts` (the Zustand store you will rewrite)
- `src/App.tsx` and `src/main.tsx`
- `struere/struere.json` (the project config the previous prompt created)

Build, in order:

1. **Entity types in `struere/entity-types/`** — one file per slug, default-exporting `defineData(...)`. Five slugs:
   - `player` — mirrors `Player` (`name`, `number`, `aliases[]`, `position`, `category`, `status`, `phone`, `guardianName`, `guardianPhone`, `notes`). `searchFields: ['name', 'number', 'aliases']`. Required: `name`, `number`, `position`.
   - `club-match` — mirrors `ClubMatch` (`date`, `time`, `opponent`, `location`, `competition`, `status` enum scheduled|live|finished, `notes`). Required: `date`, `time`, `opponent`.
   - `callup` — flat-tuple `{ matchId, playerId, availability, notes? }`. `matchId` declares `references: 'club-match'`, `playerId` declares `references: 'player'`. Availability: pending|available|unavailable|maybe. ONE row per `(matchId, playerId)` pair (ADR-0002 — agents update individual tuples without read-modify-write of a whole list).
   - `training-session` — array-of-records: `{ date, time, focus, location, loads: Array<{ playerId, present, minutes, rpe, fatigue, pain, notes? }>, notes? }`. Different access pattern than callup: the coach views all loads of a session together; no single-load tuple updates.
   - `volleyball-event` — mirrors `VolleyballEvent` (`matchId` references `club-match`, `playerId` references `player`, `sequence`, `createdAt`, `teamSide`, `playerName`, `actionType`, `result`, `pointFor`, `source`, `rawTranscript`, `notes`).
   Add `struere/entity-types/index.ts` re-exporting each slug — Struere picks them up.

2. **Sync**: `cd struere && bunx struere sync`. Then `bunx struere status` — confirm five entity types registered.

3. **ADR** — `docs/adr/0002-flat-callup-tuples-at-storage.md`. One paragraph, prose, no headings — match ADR-0001's tone. Cite ADR-0001 as the in-memory shape decision and explain ADR-0002 is the storage-side complement: per-tuple rows on the wire, `Record<playerId, Availability>` in memory, the Callup module the only mediator. Note TrainingSession does NOT follow this pattern (whole-session access).

4. **Add the SDK as runtime dep**: from project root (NOT `struere/`), `bun add struere`. The CLI binary is global; the runtime package needs to be a project dep so `import { StruereClient } from 'struere/client'` resolves.

5. **API key for the Vite app**:
   - Verify `.gitignore` covers `*.local`. Add it if missing.
   - Create `.env.example` at project root: `VITE_STRUERE_API_KEY=` with a one-line comment.
   - Generate dev key: `cd struere && bunx struere keys create --name "vite-spa-dev" --env development --json`. Take `key` from the JSON and write it to `.env.local` as `VITE_STRUERE_API_KEY=...`. NEVER commit `.env.local`.

6. **Typed client wrapper at `src/lib/struere.ts`**:
   - One `StruereClient` from `struere/client` (NOT bare `struere` — that's the CLI/SDK author API; `struere/client` is the consumer SDK). `apiKey: import.meta.env.VITE_STRUERE_API_KEY as string`.
   - Per-entity namespaces: `struere.player`, `struere.clubMatch`, `struere.callup`, `struere.trainingSession`, `struere.volleyballEvent`.
   - Each (except callup) has `list, get, create, update, remove`. The SDK returns `Entity<T> = { id, data: T }`; flatten to `{ id, ...data }` on read, lift back on write.
   - **`callup`** does NOT expose generic CRUD. It exposes: `list`, `setAvailability`, `removeEntry`, `removeForMatch`, `removeForPlayer`. `list` aggregates flat rows back to `MatchCallup[]` via `Callup.fromRows`. `setAvailability(matchId, playerId, value)` queries `(matchId, playerId)` (`filters: { 'data.matchId': matchId, 'data.playerId': playerId }`), updates if found, else creates. `removeForMatch`/`removeForPlayer` `Promise.all`-delete every matching tuple — used by the cascades.
   - For `trainingSession`, route through `Training.fromRow` / `Training.toRow` projection helpers in `src/domain/training.ts` (in-memory has `loads: Record<playerId, TrainingLoad>`; storage has `loads: TrainingLoad[]`). Add those helpers in step 7.
   - Pass `status: 'active'` on every `list`/`query` call so soft-deleted tombstones don't surface.
   - Export a `chat(params)` helper wrapping `client.chat(...)` — Prompt 3 will use it.

7. **Domain projection helpers** — extend existing modules; no new files:
   - `src/domain/callup.ts`: add `CallupRow` type (`{ id, matchId, playerId, availability, notes? }`), `Callup.fromRows(rows): MatchCallup[]` (group by `matchId`, last-wins on duplicate `(matchId, playerId)`), `Callup.toRows(callup): CallupRow[]`. Plus `Callup.create(callups, matchId)` (returns list with empty `MatchCallup` appended if not present) and `Callup.removePlayerEverywhere(callups, playerId)`.
   - `src/domain/training.ts`: add `TrainingSessionRow` type (with `loads: TrainingLoad[]`), `Training.fromRow` / `Training.toRow`. Plus `Training.setLoad(sessions, sessionId, playerId, partial)` and `Training.removePlayerEverywhere(sessions, playerId)`.
   - Round-trip tests in `src/domain/callup.test.ts` and `src/domain/training.test.ts`. Callup test must include the duplicate-tuple last-wins case explicitly.

8. **Rewrite `src/store/useStore.ts`**:
   - Drop `mocks.ts` seed import. Initial entity arrays empty.
   - Add `status: 'idle' | 'loading' | 'ready' | 'error'` and `error: string | null`.
   - `loadAll()` fans out 5 `struere.*.list()` calls in parallel; `'ready'` on success, `'error'` with the message on failure.
   - Convert mutations to async pessimistic — `await struere.*` first, then `set(...)`. Persist, then mirror.
   - **`removePlayer` cascade**: `Promise.all([struere.callup.removeForPlayer(id), ...trainingSessionUpdates, struere.player.remove(id)])`. Training updates from `Training.removePlayerEverywhere` — only sessions whose loads actually changed.
   - **`addMatch`**: `struere.clubMatch.create()`. DO NOT create an empty callup row server-side — empty `MatchCallup` is the natural absence of rows.
   - `removeMatch` cascade: `struere.callup.removeForMatch(id)` then `struere.clubMatch.remove(id)`.

9. **Rewrite `src/App.tsx`**:
   - `useEffect(() => { useStore.getState().loadAll(); }, []);` — call via `getState()`, not a selector that depends on `loadAll`. In Zustand v5 `useStore((s) => s.loadAll)` returns a fresh function reference each render and re-fires the effect every render.
   - `status === 'idle' || 'loading'` → centered "Loading…" splash.
   - `status === 'error'` → rose card with the error and a "Retry" button calling `useStore.getState().loadAll()`.
   - Render `<BrowserRouter>` only when `status === 'ready'`.

10. **Defensive service-worker unregister in `index.html`** — past PWA experiments leave SW registrations on `localhost:5173` that intercept fetches and break dev. Add a small inline `<script>` near the top of `<body>` calling `navigator.serviceWorker.getRegistrations()` and unregistering every one. Idempotent.

11. **SDK code patterns to follow:**
    - **Filter syntax**: prefix domain JSON fields with `data.` in `entity.query` / `client.data.query` / `scopeRules` — e.g., `filters: { 'data.matchId': id }`. Top-level columns (`id`, `type`, `status`, `createdAt`, `updatedAt`) stay bare. Equality is default; `$eq | $neq | $in | $contains | $gt | $lt | $gte | $lte | $exists` available.
    - **Soft-delete**: pass `status: 'active'` on every `list`/`query` (entity-level `status`, distinct from any domain `status` field).
    - `defineData` schema is closed: no `additionalProperties`, `if/then/else`, or `oneOf/allOf` — that's why Callup is flat (`Record<id, X>` can't be persisted under closed schema).

12. **Verify**:
    - `bunx tsc --noEmit` clean from project root and from `struere/`.
    - `bun test src/domain/callup.test.ts src/domain/training.test.ts` green.
    - `cd struere && bunx struere sync` reports 5 entity types.
    - `bun run dev`, hard-reload. Brief "Loading…", then empty UI (correct — no entities yet). Add a player via Roster; reload; player still there. Green light.

13. **Commit**: `git add -A && git commit -m "feat: migrate from mocks to Struere entities + SDK"`.

UI copy English; identifiers English; bun, never npm; no comments in any code you write.
```

---

### **Prompt 3 — Define 4 agents + tools + role + chat widget**

> Run after Prompt 2's commit. The prompt commits its own work at the end.
> Time: ~5 min.

```
Build the agent layer of Sportistics on Struere. Five entity types exist (`player`, `club-match`, `callup`, `training-session`, `volleyball-event`); the SPA reads/writes through `src/lib/struere.ts`. Add 4 agents acting on those entities across chat, WhatsApp, voice, and cron+email — and wire the existing chat widget to the first one. The `struere-developer` skill at `.claude/skills/struere-developer` is the SDK source of truth — consult it for `defineAgent`, `defineTools`, `defineRole`, `defineTrigger`, and the agent runtime's tool-call shape.

Read first:
- `CONTEXT.md` (domain glossary)
- `src/lib/struere.ts` — the SPA wrapper. The `set_availability` tool must mirror its `setAvailability` upsert exactly so SPA writes and agent writes agree.
- `src/components/AgentPanel.tsx` — existing chat widget. Sparkles icon + "Assistant" + 3 suggestions + disabled input/Send already in place; you're enabling them.
- `src/store/useStore.ts` — only to confirm what mutations exist; agents bypass the store and go straight to entities.

Build, in order:

1. **Four agents in `struere/agents/`** — one file per slug, default-exporting `defineAgent(...)`. English system prompts, terse, instruction-heavy. Use `{{organizationName}}`, `{{currentTime}}`, `{{threadContext.channel}}`, `{{threadContext.params.*}}` template vars where relevant. **Every agent declares `roles: ['coach-bot']`** (the agent-role binding). **Read the voice cookbook before writing voice-agent code: https://docs.struere.dev/integrations/voice-cookbook.** Each agent uses the default `maxTokens: 4096` — don't override. Slugs:
   - **`coach-stats`** — read-only DB widget. Tools: `query_stats`, `query_player`, `query_match`, `list_players`, `list_matches`. System prompt: explain the readable entities, the tools, and the rules — use `query_player` to resolve a name to an id before calling `query_stats({ playerId })`; for "last match" use `list_matches({ status: 'finished' })` and take the most recent; never invent data. `firstMessageSuggestions`: three coach questions ("Who scored the most points this month?", "How many active players are there?", "How did the last match end?"). `model: { model: 'openai/gpt-5-mini', temperature: 0.3 }`.
   - **`whatsapp-callup`** — WA inbound. Tools: `get_player_by_phone`, `list_matches`, `set_availability`, `whatsapp.send`, `agent.chat`. System prompt FORCES this order: extract phone → `get_player_by_phone` → if null, send "I don't have you registered, message the coach" via `whatsapp.send` and stop → `list_matches({ status: 'scheduled' })` and take the first → parse the player's reply into available|unavailable|maybe → `set_availability({ matchId, playerId, value })` → `whatsapp.send` confirming. The `list_matches` step is load-bearing: without it the agent invents matchIds. On `value === 'unavailable'`, AFTER confirming, call `agent.chat({ agentSlug: 'voice-suplente', message: 'Player <name> canceled for match <matchId> (<date> vs <opponent>). Call an active substitute and confirm them.' })`. `temperature: 0.2`.
   - **`voice-suplente`** — Twilio outbound. Tools (5, at the cap): `get_replacement_candidates`, `set_availability`, `voice.call`, `list_matches`, `list_players`. Natural friendly English, short sentences. Two modes: orchestrator (text, invoked via `agent.chat` from `whatsapp-callup` — pick a candidate, call `voice.call`, end) and voice-session (inside the live OpenAI Realtime call — silent setup → greet once → branches → never re-greet). Single-agent two-mode shape per the cookbook (https://docs.struere.dev/integrations/voice-cookbook). Pass `agentSlug: 'voice-suplente'` to `voice.call` (lints at sync time). Per-integration footguns: https://docs.struere.dev/integrations/voice#footguns. Volleyball anchors: cache nearest-match opponent + date during silent setup (otherwise the agent hallucinates rivals); greeting is `"Hey, this is the coach bot for {{organizationName}}. We have a match on <date> against <opponent> and we need a sub. Can you play?"`; confirmations call `set_availability({ matchId, playerId, value: 'available' })` then end; one sentence per turn, max 3 names if listing the squad, never speak IDs aloud. `model: { model: 'openai/gpt-5-mini', temperature: 0.4 }`.
   - **`weekly-digest`** — cron Sunday 20:00 in `America/Santiago`. Tools: `build_digest`, `email.send`. System prompt: compute `from = currentTime - 7 days at 00:00:00Z`, `to = currentTime` → `build_digest({ from, to })` returns `{ body, counts }` → `email.send({ to, subject: 'Sportistics weekly digest', text: body })`. Destination email comes from `threadContext.params.coachEmail`; if empty or missing `@`, fall back to `coach@sportistics.dev`. Validate the `@` BEFORE calling `email.send`. Declare `threadContextParams: [{ name: 'coachEmail', type: 'string', required: false, description: '...' }]`. `temperature: 0.3`.

2. **Ten custom tools in `struere/tools/index.ts`** — single file. Default-export `defineTools([...])`. JSON Schema schemas; handlers `async (args, context, struere, fetch) => ...`. Pull row data with `(e.data ?? e)` and lift `id` to the top so handlers return clean records.
   - `query_stats({ matchId?, playerId?, fromDate?, toDate? })` — `entity.query({ type: 'volleyball-event', limit: 1000, status: 'active' })`, filter in JS. Aggregate per `playerId`: `points` (`actionType === 'point'`), `kills` (`result === 'kill'`), `aces` (`result === 'ace'`), `errors` (`result === 'error'`), `total`. Return `{ count, byPlayer }` sorted by `points` desc.
   - `query_player({ name?, number?, phone? })` — substring match on name (case-insensitive), exact on number, exact on `phone` OR `guardianPhone`. Filter in JS.
   - `query_match({ matchId })` — `entity.get({ id: matchId })`; `entity.query({ type: 'callup', filters: { 'data.matchId': matchId } })`; `entity.query({ type: 'volleyball-event', filters: { 'data.matchId': matchId } })`; derive `score: { home, away }` from `pointFor`. Return `{ match, callups, score, eventCount }`.
   - `list_players({ status? })` — needed because `query_player` is search-by-attribute, not list-all. Fetch with `status: 'active'` (entity-level soft-delete), filter in JS by `data.status === status` if provided.
   - `list_matches({ status? })` — same pattern, filter by `data.status` (scheduled|live|finished). Sort by `date` ascending.
   - `get_player_by_phone({ phone })` — fetch active players, return the first whose `phone` OR `guardianPhone` matches. Return `{ player: ... | null }`.
   - `set_availability({ matchId, playerId, value })` — `entity.query({ type: 'callup', filters: { 'data.matchId': matchId, 'data.playerId': playerId }, limit: 1 })` → if found, `entity.update`; else `entity.create`. Mirror the SPA wrapper's `struere.callup.setAvailability` exactly.
   - `get_replacement_candidates({ matchId })` — `entity.query({ type: 'callup', filters: { 'data.matchId': matchId } })` → collect used `playerId`s → `entity.query({ type: 'player' })` → filter to `data.status === 'active'` and `!usedIds.has(p.id)`.
   - `query_events_range({ from, to })` — fetch events; filter in JS by `createdAt >= from && createdAt <= to`.
   - `build_digest({ from, to })` — pure markdown formatter. Internally fetches events / matches / training sessions / players; computes top scorers (top 3 by point+kill+ace), finished matches in the week, upcoming matches after `to`, training pain reports (`pain >= 5`). Returns `{ body, counts: { events, finishedMatches, upcomingMatches, painReports } }`. The `weekly-digest` agent calls this ONCE per run instead of orchestrating queries itself — that's why its system prompt forbids `entity.query` and `query_events_range`.

3. **Role at `struere/roles/coach-bot.ts`** — `defineRole({ name: 'coach-bot', description: '...', policies: [...] })`. Policies: read on every entity slug, plus create/update/delete on `callup`. Concretely: `[{ resource: 'player', actions: ['list', 'read'], effect: 'allow' }, { resource: 'club-match', actions: ['list', 'read'], effect: 'allow' }, { resource: 'volleyball-event', actions: ['list', 'read'], effect: 'allow' }, { resource: 'training-session', actions: ['list', 'read'], effect: 'allow' }, { resource: 'callup', actions: ['list', 'read', 'create', 'update', 'delete'], effect: 'allow' }]`. **Do NOT add `agentAccess` to the role** — that field is a dashboard ACL (which humans holding this role can chat with these agents from the dashboard UI). It is NOT a permission grant or the agent-role binding. The actual binding is on the agent side via `defineAgent({ roles: [...] })` in step 1.

4. **Cron trigger at `struere/triggers/weekly-digest-cron.ts`** — `defineTrigger({ name: 'Weekly Digest Cron', slug: 'weekly-digest-cron', description: '...', on: { schedule: '0 20 * * 0', timezone: 'America/Santiago' }, actions: [{ tool: 'agent.chat', args: { agent: 'weekly-digest', message: 'Compile the week\\'s summary and email it to the coach.' } }] })`.

5. **Wire `src/components/AgentPanel.tsx` to `coach-stats`**:
   - State: `messages: Array<{ id, role: 'user' | 'agent', text: string }>`, `input: string`, `pending: boolean`, `error: string | null`, `threadId: string | undefined`. Persist `threadId` across turns.
   - Enable the input and Send. Make the 3 suggestion buttons click-to-send (same path as form submit).
   - `send(text)` wraps `chat({ agentSlug: 'coach-stats', message: text, threadId })` — exported from `src/lib/struere.ts`. On success, append the agent message and update `threadId` from the response. On failure, surface the error.
   - Bubbles: user right-aligned `bg-brand text-white rounded-br-sm`, agent left-aligned `bg-slate-100 text-slate-900 rounded-bl-sm`. Empty state when `messages.length === 0` (existing `EmptyState` is fine — keep its Sparkles + suggestions). "thinking…" while `pending`. Rose error banner above the form on failure.
   - The mobile FAB drawer reuses the same state — share `bodyProps` between the desktop sidebar and the mobile drawer.

6. **Sync**: `cd struere && bunx struere sync`. Confirm 4 agents + 1 trigger + 1 role registered. The 3 integration warnings about `whatsapp.send` / `voice.call` / `email.send` not being connected are EXPECTED when Kapso / Twilio / Resend integrations aren't wired up at the dashboard yet — workshop-host setup, not bugs. Then `bunx tsc --noEmit` clean from project root and `struere/`.

   **Twilio + voice agent** (when ready): `bunx struere integration twilio --account-sid <SID> --auth-token <TOKEN> --phone-number <+E164> --agent voice-suplente --yes`. No router file needed unless you customize `voiceConfig`.

7. **Smoke test**: `cd struere && bunx struere chat coach-stats --message "how many active players do I have?" --json` — should answer with a count grounded in `list_players({ status: 'active' })`, not a permission error or invented number. The `--json` output includes `executionMeta.toolCalls` so you can verify the tool path. Then `bun run dev` and ask the same through the AgentPanel — answers should match.

8. **Commit**: `git add -A && git commit -m "feat: add 4 agents, 10 tools, role, cron trigger + wire chat widget"`.

UI copy English; identifiers English; bun, never npm; no comments in any code.
```

## Live channel testing (optional)

Both prompts get the chat widget working with no integrations connected. To exercise WhatsApp inbound and voice outbound:

```bash
# Twilio voice
bunx struere integration twilio --account-sid <SID> --auth-token <TOKEN> \
  --phone-number <+E164> --agent voice-suplente --yes

# WhatsApp via Kapso
bunx struere whatsapp enable --environment development
bunx struere whatsapp setup --environment development
bunx struere whatsapp set-agent --slug whatsapp-callup --environment development
```

See the [Struere Voice Agent Cookbook](https://docs.struere.dev/integrations/voice-cookbook) for the complete voice setup + WhatsApp routing details.

## Domain & architecture

Full glossary in [`CONTEXT.md`](./CONTEXT.md).

**Five entity types** (Struere = the database; SPA + agents share one source of truth):

- **Player** — roster person; `category` U-14|U-16|U-18|Adult (Youth requires `guardianName`+`guardianPhone`); `status` active|injured|inactive.
- **ClubMatch** — scheduled match (`date`, `time`, `opponent`, `location`, `competition`, `status` scheduled|live|finished).
- **Callup** — flat-tuple `(matchId, playerId, availability)`; availability pending|available|unavailable|maybe; absence-of-row = not in callup.
- **TrainingSession** — array-of-records: one entity per session with `loads[]` (per attending player: `present`, `minutes`, `rpe`, `fatigue`, `pain`).
- **VolleyballEvent** — match action (`actionType`, `result`, `pointFor`, `playerId`, `matchId`); `PlayerStats` is derived, never stored.

**Two ADRs** (full prose in [`docs/adr/`](./docs/adr/)):

- [**ADR 0001**](./docs/adr/0001-callup-availability-as-source-of-truth.md) — `MatchCallup.availability` is the only source of truth in the frontend; the old `playerIds[]` is gone.
- [**ADR 0002**](./docs/adr/0002-flat-callup-tuples-at-storage.md) — Storage keeps Callup as one row per `(matchId, playerId)` even though in-memory it's a `Record<playerId, Availability>`. `Callup.fromRows`/`toRows` is the only mediator. TrainingSession does NOT follow this pattern (whole-session access).

**Four agents** (deeper material in [`struere/CLAUDE.md`](./struere/CLAUDE.md)):

- **`coach-stats`** — chat widget (read-only, every routed page); reads players/matches/events, aggregates stats on the fly.
- **`whatsapp-callup`** — WhatsApp inbound; `yes`/`can't`/`maybe` → phone match → next match → updates Callup tuple → confirms.
- **`voice-suplente`** — Twilio outbound + OpenAI Realtime; calls a non-callup active player asking "Can you play?"; on yes, sets availability `available`. Single agent, dual mode (orchestrator + voice session).
- **`weekly-digest`** — cron Sunday 20:00 `America/Santiago`; `build_digest` → `email.send` to coach.

**Surprise orchestration** (the workshop closer): `whatsapp-callup` (parses "can't", marks `unavailable`) → `agent.chat` → `voice-suplente` (picks candidate, dials, sets `available` on yes) → next Sunday `weekly-digest` picks up the change. Four agents, one coach problem, end-to-end.

## Testing the agents

**`coach-stats`** (no integration deps):
```bash
cd struere && bunx struere chat coach-stats --message "how many active players do I have?" --json   # expect executionMeta.toolCalls includes list_players
```
Or open the SPA, click the Sparkles icon (sidebar) / FAB (mobile), use a suggestion or type `Who scored the most points?`.

**`whatsapp-callup`** (needs Kapso). First update a Player's `phone` to your real E.164:
```bash
cd struere && bunx struere data update <player-id> --data '{"phone":"+...."}'
# then text yes / can't / maybe to the connected business number
```

**`voice-suplente`** (needs Twilio). Pick an active Player NOT in the next callup, set their phone as above, then:
```bash
bunx struere chat voice-suplente --message "Call a sub for the next match"
# or trigger via WhatsApp orchestration: reply `can't` from a Player IN the next callup. Phone rings 10–20s.
```

**`weekly-digest`**:
```bash
bunx struere chat weekly-digest --message "Compile the digest"   # ad-hoc
bunx struere triggers list                                       # verify cron registered (Sun 20:00 America/Santiago)
```

## ADRs

- [`docs/adr/0001-callup-availability-as-source-of-truth.md`](./docs/adr/0001-callup-availability-as-source-of-truth.md) — `MatchCallup.availability` is the only collection; `playerIds[]` was dropped because the two drifted.
- [`docs/adr/0002-flat-callup-tuples-at-storage.md`](./docs/adr/0002-flat-callup-tuples-at-storage.md) — Storage persists `Callup` as one row per `(matchId, playerId)` so agents can update one entry atomically; the in-memory dict from ADR 0001 still holds via `fromRows`/`toRows`.

## License / credits

Workshop authored by Marco Gómez ([Struere](https://struere.dev)) for **HACK@LATAM** (May 15–17, 2026). Live session: Tue May 6, 8:00 AM Sydney time, online, 30 min.

This repo is the canonical worked example for the [Struere Voice Agent Cookbook](https://docs.struere.dev/integrations/voice-cookbook).

Built with Bun, React 19, Vite, Zustand, Tailwind 4, and the Struere SDK.

