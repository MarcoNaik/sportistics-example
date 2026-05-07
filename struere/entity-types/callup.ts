import { defineData, type JSONSchema } from 'struere'

const schema: JSONSchema = {
  type: 'object',
  properties: {
    matchId: { type: 'string', references: 'club-match', description: 'Match this entry belongs to' },
    playerId: { type: 'string', references: 'player', description: 'Player whose availability this records' },
    availability: {
      type: 'string',
      enum: ['pending', 'available', 'unavailable', 'maybe'],
      description: 'Player availability for this match',
    },
    notes: { type: 'string', description: 'Free-text note about this player availability for this match' },
  },
  required: ['matchId', 'playerId', 'availability'],
}

export default defineData({
  name: 'Callup',
  slug: 'callup',
  schema,
  searchFields: [],
  displayConfig: { titleField: 'playerId', subtitleField: 'availability' },
})
