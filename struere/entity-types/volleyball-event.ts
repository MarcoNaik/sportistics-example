import { defineData } from 'struere'

export default defineData({
  name: 'Volleyball Event',
  slug: 'volleyball-event',
  schema: {
    type: 'object',
    properties: {
      sequence: { type: 'number' },
      createdAt: { type: 'string' },
      matchId: { type: 'string' },
      teamSide: { type: 'string', enum: ['home', 'away'] },
      playerId: { type: 'string' },
      playerName: { type: 'string' },
      actionType: {
        type: 'string',
        enum: ['serve', 'reception', 'set', 'attack', 'block', 'dig', 'assist', 'point', 'substitution', 'timeout', 'note', 'unknown'],
      },
      result: {
        type: 'string',
        enum: ['ace', 'error', 'in_play', 'positive', 'perfect', 'kill', 'attempt', 'blocked', 'stuff', 'touch', 'point', 'out', 'net', 'double', 'lift', 'none', 'unknown'],
      },
      pointFor: { type: 'string', enum: ['home', 'away'] },
      source: { type: 'string', enum: ['voice', 'manual'] },
      rawTranscript: { type: 'string' },
      notes: { type: 'string' },
    },
    required: ['sequence', 'matchId', 'teamSide', 'actionType', 'result', 'source'],
  },
  searchFields: ['playerName', 'rawTranscript'],
  displayConfig: { titleField: 'actionType', subtitleField: 'playerName' },
})
