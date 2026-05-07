import { StruereClient, type Entity } from 'struere/client'
import type { Player, ClubMatch, MatchCallup, TrainingSession, VolleyballEvent } from '../domain/types'
import * as Callup from '../domain/callup'
import type { CallupRow } from '../domain/callup'
import * as Training from '../domain/training'
import type { TrainingSessionRow } from '../domain/training'

const client = new StruereClient({ apiKey: import.meta.env.VITE_STRUERE_API_KEY as string })

type WithoutId<T extends { id: string }> = Omit<T, 'id'>

function fromEntity<T extends { id: string }>(e: Entity<WithoutId<T>>): T {
  return { id: e.id, ...e.data } as T
}

function toData<T extends { id: string }>(value: T): WithoutId<T> {
  const { id: _id, ...rest } = value
  return rest as WithoutId<T>
}

const player = {
  list: async (): Promise<Player[]> => {
    const page = await client.data.list<WithoutId<Player>>('player', { limit: 100, status: 'active' })
    return page.data.map((e) => fromEntity<Player>(e))
  },
  get: async (id: string): Promise<Player> => {
    const entity = await client.data.get<WithoutId<Player>>('player', id)
    return fromEntity<Player>(entity)
  },
  create: async (value: WithoutId<Player>): Promise<Player> => {
    const entity = await client.data.create<WithoutId<Player>>('player', value)
    return fromEntity<Player>(entity)
  },
  update: async (id: string, partial: Partial<WithoutId<Player>>): Promise<Player> => {
    const entity = await client.data.update<WithoutId<Player>>('player', id, partial)
    return fromEntity<Player>(entity)
  },
  remove: async (id: string): Promise<void> => {
    await client.data.delete('player', id)
  },
}

const clubMatch = {
  list: async (): Promise<ClubMatch[]> => {
    const page = await client.data.list<WithoutId<ClubMatch>>('club-match', { limit: 100, status: 'active' })
    return page.data.map((e) => fromEntity<ClubMatch>(e))
  },
  get: async (id: string): Promise<ClubMatch> => {
    const entity = await client.data.get<WithoutId<ClubMatch>>('club-match', id)
    return fromEntity<ClubMatch>(entity)
  },
  create: async (value: WithoutId<ClubMatch>): Promise<ClubMatch> => {
    const entity = await client.data.create<WithoutId<ClubMatch>>('club-match', value)
    return fromEntity<ClubMatch>(entity)
  },
  update: async (id: string, partial: Partial<WithoutId<ClubMatch>>): Promise<ClubMatch> => {
    const entity = await client.data.update<WithoutId<ClubMatch>>('club-match', id, partial)
    return fromEntity<ClubMatch>(entity)
  },
  remove: async (id: string): Promise<void> => {
    await client.data.delete('club-match', id)
  },
}

type TrainingRowData = Omit<TrainingSessionRow, 'id'>

function trainingFromEntity(e: Entity<TrainingRowData>): TrainingSession {
  const row: TrainingSessionRow = { id: e.id, ...e.data }
  return Training.fromRow(row)
}

function trainingToData(session: TrainingSession): TrainingRowData {
  const row = Training.toRow(session)
  const { id: _id, ...rest } = row
  return rest
}

const trainingSession = {
  list: async (): Promise<TrainingSession[]> => {
    const page = await client.data.list<TrainingRowData>('training-session', { limit: 100, status: 'active' })
    return page.data.map(trainingFromEntity)
  },
  get: async (id: string): Promise<TrainingSession> => {
    const entity = await client.data.get<TrainingRowData>('training-session', id)
    return trainingFromEntity(entity)
  },
  create: async (session: WithoutId<TrainingSession>): Promise<TrainingSession> => {
    const data = trainingToData({ id: '', ...session })
    const entity = await client.data.create<TrainingRowData>('training-session', data)
    return trainingFromEntity(entity)
  },
  update: async (id: string, session: TrainingSession): Promise<TrainingSession> => {
    const data = trainingToData(session)
    const entity = await client.data.update<TrainingRowData>('training-session', id, data)
    return trainingFromEntity(entity)
  },
  remove: async (id: string): Promise<void> => {
    await client.data.delete('training-session', id)
  },
}

type CallupRowData = Omit<CallupRow, 'id'>

async function findCallupRowByTuple(matchId: string, playerId: string): Promise<Entity<CallupRowData> | null> {
  const page = await client.data.query<CallupRowData>('callup', {
    filters: { matchId: { $eq: matchId }, playerId: { $eq: playerId } },
    limit: 1,
    status: 'active',
  })
  return page.data[0] ?? null
}

const callup = {
  list: async (): Promise<MatchCallup[]> => {
    const page = await client.data.list<CallupRowData>('callup', { limit: 1000, status: 'active' })
    const rows: CallupRow[] = page.data.map((e) => ({ id: e.id, ...e.data }))
    return Callup.fromRows(rows)
  },
  setAvailability: async (
    matchId: string,
    playerId: string,
    value: MatchCallup['availability'][string],
  ): Promise<void> => {
    const found = await findCallupRowByTuple(matchId, playerId)
    if (found) {
      await client.data.update<CallupRowData>('callup', found.id, { availability: value })
      return
    }
    await client.data.create<CallupRowData>('callup', { matchId, playerId, availability: value })
  },
  removeEntry: async (matchId: string, playerId: string): Promise<void> => {
    const found = await findCallupRowByTuple(matchId, playerId)
    if (!found) return
    await client.data.delete('callup', found.id)
  },
  removeForMatch: async (matchId: string): Promise<void> => {
    const page = await client.data.query<CallupRowData>('callup', {
      filters: { matchId: { $eq: matchId } },
      limit: 1000,
      status: 'active',
    })
    await Promise.all(page.data.map((e) => client.data.delete('callup', e.id)))
  },
  removeForPlayer: async (playerId: string): Promise<void> => {
    const page = await client.data.query<CallupRowData>('callup', {
      filters: { playerId: { $eq: playerId } },
      limit: 1000,
      status: 'active',
    })
    await Promise.all(page.data.map((e) => client.data.delete('callup', e.id)))
  },
}

const volleyballEvent = {
  list: async (): Promise<VolleyballEvent[]> => {
    const page = await client.data.list<WithoutId<VolleyballEvent>>('volleyball-event', { limit: 100, status: 'active' })
    return page.data.map((e) => fromEntity<VolleyballEvent>(e))
  },
  get: async (id: string): Promise<VolleyballEvent> => {
    const entity = await client.data.get<WithoutId<VolleyballEvent>>('volleyball-event', id)
    return fromEntity<VolleyballEvent>(entity)
  },
  create: async (value: WithoutId<VolleyballEvent>): Promise<VolleyballEvent> => {
    const entity = await client.data.create<WithoutId<VolleyballEvent>>('volleyball-event', value)
    return fromEntity<VolleyballEvent>(entity)
  },
  update: async (id: string, partial: Partial<WithoutId<VolleyballEvent>>): Promise<VolleyballEvent> => {
    const entity = await client.data.update<WithoutId<VolleyballEvent>>('volleyball-event', id, partial)
    return fromEntity<VolleyballEvent>(entity)
  },
  remove: async (id: string): Promise<void> => {
    await client.data.delete('volleyball-event', id)
  },
}

export const struere = {
  player,
  clubMatch,
  callup,
  trainingSession,
  volleyballEvent,
}

export { toData }
