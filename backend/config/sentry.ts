import env from '#start/env'
import * as Sentry from '@sentry/node'

const dsn = env.get('SENTRY_DSN', '')

if (dsn) {
  Sentry.init({
    dsn,
    environment: env.get('NODE_ENV', 'development'),
    tracesSampleRate: env.get('NODE_ENV') === 'production' ? 0.2 : 1.0,
  })
}

export default Sentry
