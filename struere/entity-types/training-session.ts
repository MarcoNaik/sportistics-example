import { defineData } from 'struere'

export default defineData({
  name: 'Training Session',
  slug: 'training-session',
  schema: {
    type: 'object',
    properties: {
      date: { type: 'string' },
      time: { type: 'string' },
      focus: { type: 'string' },
      location: { type: 'string' },
      loads: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            playerId: { type: 'string' },
            present: { type: 'boolean' },
            minutes: { type: 'number' },
            rpe: { type: 'number' },
            fatigue: { type: 'number' },
            pain: { type: 'number' },
            notes: { type: 'string' },
          },
          required: ['playerId', 'present', 'minutes', 'rpe', 'fatigue', 'pain'],
        },
      },
      notes: { type: 'string' },
    },
    required: ['date', 'focus'],
  },
  searchFields: ['focus', 'location'],
  displayConfig: { titleField: 'focus', subtitleField: 'date' },
})
