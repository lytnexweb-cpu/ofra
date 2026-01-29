import env from '#start/env'

const queueConfig = {
  connection: {
    host: env.get('REDIS_HOST', '127.0.0.1'),
    port: env.get('REDIS_PORT', 6379),
    password: env.get('REDIS_PASSWORD', ''),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 1000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
  queues: {
    automations: 'ofra:automations',
    reminders: 'ofra:reminders',
  },
}

export default queueConfig
