import { defineData } from 'struere'

export default defineData({
  name: 'Club Match',
  slug: 'club-match',
  schema: {
    type: 'object',
    properties: {
      date: { type: 'string' },
      time: { type: 'string' },
      opponent: { type: 'string' },
      location: { type: 'string' },
      competition: { type: 'string' },
      status: { type: 'string', enum: ['scheduled', 'live', 'finished'] },
      notes: { type: 'string' },
    },
    required: ['date', 'opponent'],
  },
  searchFields: ['opponent', 'location', 'competition'],
  displayConfig: { titleField: 'opponent', subtitleField: 'date' },
})
