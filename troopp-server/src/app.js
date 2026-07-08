import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import morgan from 'morgan'
import passport from 'passport'

import { Sentry, initSentry, sentryRequestContextMiddleware } from './config/sentry.js'
import logger from './config/logger.js'
import initPassport from './config/passport.js'
import requestIdMiddleware from './middleware/requestId.middleware.js'
import ipBlockMiddleware from './middleware/ipBlock.middleware.js'
import { generalLimiter } from './middleware/rateLimit.middleware.js'
import errorHandler, { AppError } from './middleware/errorHandler.middleware.js'
import apiRouter from './routes/index.js'

// Initialize Sentry SDK
initSentry()

// Initialize Passport Strategies
initPassport()

const app = express()

// 1. Sentry request handler must be the first middleware on the app
if (Sentry.Handlers && typeof Sentry.Handlers.requestHandler === 'function') {
  app.use(Sentry.Handlers.requestHandler())
}

// 2. Helmet Security Headers Configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://apis.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'", 'wss://*', 'https://*.googleapis.com'],
      },
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'same-origin' },
  })
)

// Custom Permissions Policy Header Middle-ware
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(self), camera=(self), microphone=()'
  )
  next()
})

// 3. CORS Policy Configuration
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173']

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new AppError('Connection blocked by CORS policy.', 403, 'CORS_BLOCKED'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  })
)

// 4. Request Body Parsers (10mb payload limit)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Input Sanitizer: Strips HTML and trims strings globally
const sanitizeInput = (val) => {
  if (typeof val === 'string') {
    return val.replace(/<[^>]*>/g, '').trim()
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeInput)
  }
  if (typeof val === 'object' && val !== null) {
    const sanitized = {}
    for (const key in val) {
      sanitized[key] = sanitizeInput(val[key])
    }
    return sanitized
  }
  return val
}

app.use((req, res, next) => {
  if (req.body) req.body = sanitizeInput(req.body)
  if (req.query) req.query = sanitizeInput(req.query)
  next()
})

// 5. Cookie Parser for JWT HTTP-only refresh tokens
app.use(cookieParser())

// Initialize Passport.js session handler
app.use(passport.initialize())

// 6. Gzip compression middleware
app.use(compression())

// 7. HTTP Request Logger via Winston
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: logger.stream }))

// 8. Custom Request Correlation ID attaching
app.use(requestIdMiddleware)

// 9. IP block checking middleware
app.use(ipBlockMiddleware)

// 10. Sentry Scope tag enriching middleware
app.use(sentryRequestContextMiddleware)

// 11. General Rate Limiter (200 requests per minute)
app.use('/api/', generalLimiter)

// 12. Mount API Routes under /api/v1/
app.use('/api/v1', apiRouter)

// 13. Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'))
})

// 14. Sentry error handler must be before any other error middleware
if (Sentry.Handlers && typeof Sentry.Handlers.errorHandler === 'function') {
  app.use(Sentry.Handlers.errorHandler())
}

// 15. Global Error Interceptor & Formatter (last)
app.use(errorHandler)

export default app
