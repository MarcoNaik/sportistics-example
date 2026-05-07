import { defineTrigger } from 'struere'

export default defineTrigger({
  name: 'Weekly Digest Cron',
  slug: 'weekly-digest-cron',
  description: 'Every Sunday at 20:00, triggers the weekly-digest agent to compile and send the weekly summary.',
  on: {
    schedule: '0 20 * * 0',
    timezone: 'America/Santiago',
  },
  actions: [
    {
      tool: 'agent.chat',
      args: {
        agent: 'weekly-digest',
        message: 'Compile the week\'s summary (Mon-Sun) and email it to the coach. Use query_events_range, entity.query for club-match/training-session/player, build_digest, and email.send.',
      },
    },
  ],
})
