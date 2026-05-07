import { defineTools } from 'struere'

export default defineTools([
  {
    name: 'get_current_time',
    description: 'Get the current date and time in a specific timezone',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Timezone (e.g., "America/New_York", "UTC")',
        },
      },
    },
    handler: async (args, context, struere, fetch) => {
      const timezone = (args.timezone as string) || 'UTC'
      const now = new Date()
      return {
        timestamp: now.toISOString(),
        formatted: now.toLocaleString('en-US', { timeZone: timezone }),
        timezone,
        organizationId: context.organizationId,
      }
    },
  },

  {
    name: 'send_slack_message',
    description: 'Send a message to a Slack channel via webhook',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message to send',
        },
        channel: {
          type: 'string',
          description: 'Channel name (for logging purposes)',
        },
      },
      required: ['message'],
    },
    handler: async (args, context, struere, fetch) => {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL
      if (!webhookUrl) {
        return { success: false, error: 'SLACK_WEBHOOK_URL not configured' }
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: args.message,
          username: 'Struere Agent',
        }),
      })

      return {
        success: response.ok,
        status: response.status,
        actorId: context.actorId,
        actorType: context.actorType,
      }
    },
  },

  {
    name: 'query_stats',
    description: 'Aggregate VolleyballEvents into per-player stats. Optional filters by match, player, or date range. Returns counts of points, kills, aces, errors per player.',
    parameters: {
      type: 'object',
      properties: {
        matchId: { type: 'string', description: 'Filter to one match' },
        playerId: { type: 'string', description: 'Filter to one player' },
        fromDate: { type: 'string', description: 'ISO date lower bound (inclusive) on createdAt' },
        toDate: { type: 'string', description: 'ISO date upper bound (inclusive) on createdAt' },
      },
    },
    handler: async (args, context, struere, fetch) => {
      const page = await struere.entity.query({ type: 'volleyball-event', limit: 1000 })
      const rows: any[] = page.data ?? page
      const events = rows.map((e) => ({ id: e.id, ...(e.data ?? e) }))
      const matchId = args.matchId as string | undefined
      const playerId = args.playerId as string | undefined
      const fromDate = args.fromDate as string | undefined
      const toDate = args.toDate as string | undefined
      const filtered = events.filter((e: any) => {
        if (matchId && e.matchId !== matchId) return false
        if (playerId && e.playerId !== playerId) return false
        if (fromDate && (e.createdAt ?? '') < fromDate) return false
        if (toDate && (e.createdAt ?? '') > toDate) return false
        return true
      })
      const byPlayer: Record<string, { playerId: string; playerName?: string; points: number; kills: number; aces: number; errors: number; total: number }> = {}
      for (const e of filtered as any[]) {
        const pid = e.playerId
        if (!pid) continue
        const bucket = byPlayer[pid] ?? { playerId: pid, playerName: e.playerName, points: 0, kills: 0, aces: 0, errors: 0, total: 0 }
        bucket.total += 1
        if (e.actionType === 'point') bucket.points += 1
        if (e.result === 'kill') bucket.kills += 1
        if (e.result === 'ace') bucket.aces += 1
        if (e.result === 'error') bucket.errors += 1
        byPlayer[pid] = bucket
      }
      const ranked = Object.values(byPlayer).sort((a, b) => b.points - a.points)
      return { count: filtered.length, byPlayer: ranked }
    },
  },

  {
    name: 'list_players',
    description: 'List players, optionally filtered by data.status (active | injured | inactive). Returns id, name, number, position, category, status, phone, guardianPhone for each player.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'injured', 'inactive'], description: 'Filter by player status. Omit to list all players.' },
      },
    },
    handler: async (args, context, struere, fetch) => {
      const page = await struere.entity.query({ type: 'player', limit: 500 })
      const rows: any[] = page.data ?? page
      const players = rows.map((e) => ({ id: e.id, ...(e.data ?? e) }))
      const status = args.status as string | undefined
      const filtered = status ? players.filter((p) => p.status === status) : players
      return { count: filtered.length, players: filtered }
    },
  },

  {
    name: 'list_matches',
    description: 'List club matches, optionally filtered by data.status (scheduled | live | finished). Sorted by date ascending. Useful to find the next scheduled match or the most recent finished match.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['scheduled', 'live', 'finished'], description: 'Filter by match status' },
      },
    },
    handler: async (args, context, struere, fetch) => {
      const page = await struere.entity.query({ type: 'club-match', limit: 500 })
      const rows: any[] = page.data ?? page
      const matches = rows.map((e) => ({ id: e.id, ...(e.data ?? e) }))
      const status = args.status as string | undefined
      const filtered = status ? matches.filter((m) => m.status === status) : matches
      filtered.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
      return { count: filtered.length, matches: filtered }
    },
  },

  {
    name: 'query_player',
    description: 'Find players by name (substring), number (exact), or phone (exact match against phone or guardianPhone). Returns matching player rows.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name substring' },
        number: { type: 'string', description: 'Jersey number (exact)' },
        phone: { type: 'string', description: 'Phone number (matches phone or guardianPhone)' },
      },
    },
    handler: async (args, context, struere, fetch) => {
      const page = await struere.entity.query({ type: 'player', limit: 500 })
      const rows: any[] = page.data ?? page
      const players = rows.map((e) => ({ id: e.id, ...(e.data ?? e) }))
      const name = (args.name as string | undefined)?.toLowerCase()
      const number = args.number as string | undefined
      const phone = args.phone as string | undefined
      const filtered = players.filter((p) => {
        if (name && !(p.name ?? '').toLowerCase().includes(name)) return false
        if (number && p.number !== number) return false
        if (phone && p.phone !== phone && p.guardianPhone !== phone) return false
        return true
      })
      return { count: filtered.length, players: filtered }
    },
  },

  {
    name: 'query_match',
    description: 'Get a ClubMatch with its callup rows and a derived score from VolleyballEvents.',
    parameters: {
      type: 'object',
      properties: {
        matchId: { type: 'string', description: 'ClubMatch id' },
      },
      required: ['matchId'],
    },
    handler: async (args, context, struere, fetch) => {
      const matchId = args.matchId as string
      const matchEntity = await struere.entity.get({ id: matchId })
      const callupPage = await struere.entity.query({ type: 'callup', filters: { 'data.matchId': matchId }, limit: 200 })
      const eventsPage = await struere.entity.query({ type: 'volleyball-event', filters: { 'data.matchId': matchId }, limit: 1000 })
      const callups = (callupPage.data ?? callupPage).map((e: any) => ({ id: e.id, ...(e.data ?? e) }))
      const events = (eventsPage.data ?? eventsPage).map((e: any) => ({ id: e.id, ...(e.data ?? e) }))
      let home = 0
      let away = 0
      for (const e of events) {
        if (e.pointFor === 'home') home += 1
        if (e.pointFor === 'away') away += 1
      }
      return {
        match: { id: matchEntity.id, ...(matchEntity.data ?? matchEntity) },
        callups,
        score: { home, away },
        eventCount: events.length,
      }
    },
  },

  {
    name: 'get_player_by_phone',
    description: 'Find an active player whose phone OR guardianPhone matches the given phone number. Returns the first match or null.',
    parameters: {
      type: 'object',
      properties: {
        phone: { type: 'string', description: 'Phone number to match against phone or guardianPhone' },
      },
      required: ['phone'],
    },
    handler: async (args, context, struere, fetch) => {
      const phone = args.phone as string
      const page = await struere.entity.query({ type: 'player', limit: 500 })
      const rows: any[] = page.data ?? page
      const match = rows.map((e) => ({ id: e.id, ...(e.data ?? e) })).find((p) => p.phone === phone || p.guardianPhone === phone)
      return { player: match ?? null }
    },
  },

  {
    name: 'set_availability',
    description: 'Upsert a callup tuple (matchId, playerId). If a callup row exists for that pair, update its availability; otherwise create a new row.',
    parameters: {
      type: 'object',
      properties: {
        matchId: { type: 'string' },
        playerId: { type: 'string' },
        value: { type: 'string', enum: ['pending', 'available', 'unavailable', 'maybe'] },
      },
      required: ['matchId', 'playerId', 'value'],
    },
    handler: async (args, context, struere, fetch) => {
      const matchId = args.matchId as string
      const playerId = args.playerId as string
      const value = args.value as string
      const page = await struere.entity.query({
        type: 'callup',
        filters: { 'data.matchId': matchId, 'data.playerId': playerId },
        limit: 1,
      })
      const existing = (page.data ?? page)[0]
      if (existing) {
        const updated = await struere.entity.update({ id: existing.id, type: 'callup', data: { availability: value } })
        return { action: 'updated', id: existing.id, callup: updated }
      }
      const created = await struere.entity.create({ type: 'callup', data: { matchId, playerId, availability: value } })
      return { action: 'created', id: created.id, callup: created }
    },
  },

  {
    name: 'get_replacement_candidates',
    description: 'Return active players who are NOT in the given match callup — candidates to call as substitutes.',
    parameters: {
      type: 'object',
      properties: {
        matchId: { type: 'string' },
      },
      required: ['matchId'],
    },
    handler: async (args, context, struere, fetch) => {
      const matchId = args.matchId as string
      const callupPage = await struere.entity.query({ type: 'callup', filters: { 'data.matchId': matchId }, limit: 500 })
      const usedIds = new Set<string>((callupPage.data ?? callupPage).map((e: any) => (e.data ?? e).playerId))
      const playersPage = await struere.entity.query({ type: 'player', limit: 500 })
      const players = (playersPage.data ?? playersPage).map((e: any) => ({ id: e.id, ...(e.data ?? e) }))
      const candidates = players.filter((p: any) => p.status === 'active' && !usedIds.has(p.id))
      return { count: candidates.length, candidates }
    },
  },

  {
    name: 'query_events_range',
    description: 'Return VolleyballEvents whose createdAt falls within an ISO timestamp range.',
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'ISO timestamp lower bound (inclusive)' },
        to: { type: 'string', description: 'ISO timestamp upper bound (inclusive)' },
      },
      required: ['from', 'to'],
    },
    handler: async (args, context, struere, fetch) => {
      const from = args.from as string
      const to = args.to as string
      const page = await struere.entity.query({ type: 'volleyball-event', limit: 1000 })
      const rows: any[] = page.data ?? page
      const events = rows.map((e) => ({ id: e.id, ...(e.data ?? e) })).filter((e: any) => {
        const ts = e.createdAt ?? ''
        return ts >= from && ts <= to
      })
      return { count: events.length, events }
    },
  },

  {
    name: 'build_digest',
    description: 'Compile the weekly digest body. Pulls events, matches, training sessions, and players itself. Returns { body } in markdown. Pass from/to as ISO timestamps to scope events and matches to the week.',
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'ISO timestamp lower bound (inclusive) of the week window' },
        to: { type: 'string', description: 'ISO timestamp upper bound (inclusive) of the week window' },
      },
      required: ['from', 'to'],
    },
    handler: async (args, context, struere, fetch) => {
      const from = args.from as string
      const to = args.to as string
      const fromDate = from.slice(0, 10)
      const toDate = to.slice(0, 10)

      const eventsPage = await struere.entity.query({ type: 'volleyball-event', limit: 1000 })
      const events = (eventsPage.data ?? eventsPage).map((e: any) => ({ id: e.id, ...(e.data ?? e) }))
      const matchesPage = await struere.entity.query({ type: 'club-match', limit: 500 })
      const matches = (matchesPage.data ?? matchesPage).map((e: any) => ({ id: e.id, ...(e.data ?? e) }))
      const sessionsPage = await struere.entity.query({ type: 'training-session', limit: 500 })
      const trainingSessions = (sessionsPage.data ?? sessionsPage).map((e: any) => ({ id: e.id, ...(e.data ?? e) }))
      const playersPage = await struere.entity.query({ type: 'player', limit: 500 })
      const players = (playersPage.data ?? playersPage).map((e: any) => ({ id: e.id, ...(e.data ?? e) }))

      const playerById: Record<string, any> = {}
      for (const p of players) playerById[p.id] = p

      const weekEvents = events.filter((e: any) => {
        const ts = e.createdAt ?? ''
        return ts >= from && ts <= to
      })
      const scorerCounts: Record<string, number> = {}
      for (const e of weekEvents as any[]) {
        if (!e.playerId) continue
        if (e.actionType === 'point' || e.result === 'kill' || e.result === 'ace') {
          scorerCounts[e.playerId] = (scorerCounts[e.playerId] ?? 0) + 1
        }
      }
      const topScorers = Object.entries(scorerCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([pid, points]) => `- ${playerById[pid]?.name ?? pid}: ${points} points`)

      const finished = matches.filter((m: any) => m.status === 'finished' && (m.date ?? '') >= fromDate && (m.date ?? '') <= toDate)
      const upcoming = matches.filter((m: any) => m.status === 'scheduled' && (m.date ?? '') >= toDate)
      upcoming.sort((a: any, b: any) => (a.date ?? '').localeCompare(b.date ?? ''))

      const weekSessions = trainingSessions.filter((s: any) => (s.date ?? '') >= fromDate && (s.date ?? '') <= toDate)
      const painReports: string[] = []
      for (const s of weekSessions as any[]) {
        for (const load of s.loads ?? []) {
          if ((load.pain ?? 0) >= 5) {
            painReports.push(`- ${playerById[load.playerId]?.name ?? load.playerId}: pain ${load.pain}/10 (session ${s.date})`)
          }
        }
      }

      const lines: string[] = []
      lines.push('# Weekly digest')
      lines.push('')
      lines.push('## Top scorers')
      lines.push(topScorers.length ? topScorers.join('\n') : '- No points logged this week.')
      lines.push('')
      lines.push('## Matches played')
      lines.push(finished.length ? finished.map((m: any) => `- ${m.date} vs ${m.opponent}`).join('\n') : '- None.')
      lines.push('')
      lines.push('## Players with reported pain')
      lines.push(painReports.length ? painReports.join('\n') : '- None.')
      lines.push('')
      lines.push('## Upcoming matches')
      lines.push(upcoming.length ? upcoming.map((m: any) => `- ${m.date} vs ${m.opponent}`).join('\n') : '- None scheduled.')

      return {
        body: lines.join('\n'),
        counts: {
          events: weekEvents.length,
          finishedMatches: finished.length,
          upcomingMatches: upcoming.length,
          painReports: painReports.length,
        },
      }
    },
  },
])
