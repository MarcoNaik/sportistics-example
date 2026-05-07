import { defineRole } from 'struere'

export default defineRole({
  name: 'coach-bot',
  description: 'Coach bot: reads all club entities, writes only to callup.',
  policies: [
    { resource: 'player', actions: ['list', 'read'], effect: 'allow' },
    { resource: 'club-match', actions: ['list', 'read'], effect: 'allow' },
    { resource: 'volleyball-event', actions: ['list', 'read'], effect: 'allow' },
    { resource: 'training-session', actions: ['list', 'read'], effect: 'allow' },
    { resource: 'callup', actions: ['list', 'read', 'create', 'update'], effect: 'allow' },
  ],
})
