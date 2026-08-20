import * as Sentry from '@sentry/node'
import logger from './logger.js'

const initSentry = () => {
  const dsn = process.env.SENTRY_DSN

  if (!dsn || dsn === 'https://your_sentry_dsn_key@o0.ingest.sentry.io/0') {
    logger.warn('Sentry DSN is not configured. Exception tracking is disabled.')
    return
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0,
    })

    logger.info('Sentry successfully initialized.')
  } catch (error) {
    logger.error('Failed to initialize Sentry:', error)
  }
}

// Request context enrichment middleware
export const sentryRequestContextMiddleware = (req, res, next) => {
  if (process.env.SENTRY_DSN) {
    const scope = Sentry.getCurrentScope()
    scope.setExtra('reqId', req.id)
    scope.setTag('url', req.originalUrl)
    scope.setTag('method', req.method)
    if (req.user) {
      scope.setUser({ id: req.user.id, email: req.user.email })
    }
  }
  next()
}

export { Sentry, initSentry }
