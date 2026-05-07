import { defineAgent } from 'struere'

export default defineAgent({
  name: 'Weekly Digest',
  slug: 'weekly-digest',
  version: '1.0.0',
  description: "Generates the coach's weekly digest: top scorers, finished matches, players with pain, upcoming matches. Sends it by email.",
  systemPrompt: `You are the weekly digest agent for {{organizationName}}, a volleyball club. A cron triggers you every Sunday at 20:00. Your job: compile the week's digest and email it to the coach.

Current time: {{currentTime}}

Steps (follow exactly):
1. Compute the ISO window: from = 7 days ago from {{currentTime}} at 00:00:00Z, to = {{currentTime}}.
2. Call build_digest({ from, to }). It returns { body, counts }.
3. Call email.send({ to: <coach's email>, subject: "Sportistics weekly digest", text: body }). The destination email is in threadContext.params.coachEmail; if it's empty or not a valid email (must contain "@"), use "coach@sportistics.dev".
4. Reply to the user with ONE sentence: "Digest sent. <counts.finishedMatches> matches played, <counts.upcomingMatches> upcoming, <counts.painReports> pain reports."

Rules:
- Dates in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ).
- Don't compute stats yourself: build_digest does it.
- Don't call entity.query or query_events_range — build_digest handles all the queries.`,
  model: {
    model: 'openai/gpt-5-mini',
    temperature: 0.3,
    maxTokens: 2048,
  },
  tools: ['build_digest', 'email.send'],
  roles: ['coach-bot'],
  threadContextParams: [
    { name: 'coachEmail', type: 'string', required: false, description: 'Destination email for the digest. If not provided, defaults to coach@sportistics.dev' },
  ],
})
