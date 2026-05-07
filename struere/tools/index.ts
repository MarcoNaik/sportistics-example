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
])
