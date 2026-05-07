import { defineData } from 'struere'

export default defineData({
  name: 'Player',
  slug: 'player',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      number: { type: 'string' },
      aliases: { type: 'array', items: { type: 'string' } },
      position: { type: 'string', enum: ['Outside Hitter', 'Opposite', 'Middle Blocker', 'Setter', 'Libero'] },
      category: { type: 'string', enum: ['U-14', 'U-16', 'U-18', 'Adult'] },
      status: { type: 'string', enum: ['active', 'injured', 'inactive'] },
      phone: { type: 'string' },
      guardianName: { type: 'string' },
      guardianPhone: { type: 'string' },
      notes: { type: 'string' },
    },
    required: ['name', 'number', 'position'],
  },
  searchFields: ['name', 'number', 'aliases'],
  displayConfig: { titleField: 'name', subtitleField: 'position' },
})
