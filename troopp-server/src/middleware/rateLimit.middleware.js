import rateLimit from 'express-rate-limit'
import { AppError } from './errorHandler.middleware.js'

// Safe helper to resolve request IP in local environments and reverse proxies
const getRequestIp = (req) => {
  return req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
}

// Helper to create limiters with custom error responses
const createLimiter = (options) => {
  const { code, message, ...rateLimitOptions } = options
  return rateLimit({
    windowMs: rateLimitOptions.windowMs,
    max: rateLimitOptions.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(
        new AppError(
          message || 'Too many requests. Please try again later.',
          429,
          code || 'RATE_LIMIT_EXCEEDED'
        )
      )
    },
    keyGenerator: (req) => {
      // Use authenticated user ID if available, fallback to IP address
      return req.user?.id || getRequestIp(req)
    },
    ...rateLimitOptions
  })
}

// 1. Auth Signup: 5 attempts per hour per IP
export const authSignupLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many signup attempts from this network. Please try again after an hour.',
  code: 'RATE_LIMIT_SIGNUP',
  keyGenerator: (req) => getRequestIp(req) // IP-based limit
})

// 2. Auth Login: 10 attempts per 15 minutes per IP
export const authLoginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts. Account protection lockout in place.',
  code: 'RATE_LIMIT_LOGIN',
  keyGenerator: (req) => getRequestIp(req)
})

// 3. OTP Send: 3 attempts per hour per request key (IP/Identity)
export const otpSendLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many OTP requests. Please wait before asking for another OTP.',
  code: 'RATE_LIMIT_OTP',
  keyGenerator: (req) => {
    // Limit by phone or email if provided in body, else fallback to IP
    return req.body.phone || req.body.email || getRequestIp(req)
  }
})

// 4. Verify ID: 3 uploads per 24 hours per user
export const verifyIdLimiter = createLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  message: 'Maximum ID verification attempts reached for today.',
  code: 'RATE_LIMIT_VERIFY_ID'
})

// 5. Verify Face: 5 attempts per 24 hours per user
export const verifyFaceLimiter = createLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  message: 'Maximum face matching attempts reached for today.',
  code: 'RATE_LIMIT_VERIFY_FACE'
})

// 6. Create Activity: 10 posts per hour per user
export const createActivityLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'You have reached the maximum number of activities you can post in an hour.',
  code: 'RATE_LIMIT_CREATE_ACTIVITY'
})

// 7. Join Activity: 20 requests per hour per user
export const joinActivityLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many join requests sent. Take a breath and search some more feeds.',
  code: 'RATE_LIMIT_JOIN_ACTIVITY'
})

// 8. File Report: 5 filings per 24 hours per user
export const fileReportLimiter = createLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  message: 'Maximum report filing attempts reached for today.',
  code: 'RATE_LIMIT_FILE_REPORT'
})

// 9. SOS Emergency: 3 trigger attempts per 10 minutes (always allowed but flags alerts)
export const sosLimiter = createLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: 'SOS trigger limit reached. Emergency contacts are already notified.',
  code: 'RATE_LIMIT_SOS'
})

// 10. General API Requests: 200 requests per minute
export const generalLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: 'Too many general requests. Rate limit throttle applied.',
  code: 'RATE_LIMIT_GENERAL'
})
