import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { AppError } from './errorHandler.middleware.js'
import { getRedisClient, isRedisHealthy } from '../config/redis.js'
import logger from '../config/logger.js'

class MemoryStoreFallback {
  constructor() {
    this.hits = new Map()
  }
  async increment(key) {
    const now = Date.now()
    if (!this.hits.has(key)) {
      this.hits.set(key, [])
    }
    const timestamps = this.hits.get(key).filter(ts => ts > now - 60000)
    timestamps.push(now)
    this.hits.set(key, timestamps)
    return { totalHits: timestamps.length, resetTime: new Date(now + 60000) }
  }
  async decrement(key) {
    if (this.hits.has(key)) {
      this.hits.get(key).pop()
    }
  }
  async resetKey(key) {
    this.hits.delete(key)
  }
}

// Custom wrapper store that degrades gracefully to memory-store if Redis is down
class GracefulRedisStore {
  constructor(prefix) {
    this.redisStore = null
    this.memoryStore = new MemoryStoreFallback()
    this.prefix = prefix || 'rl:gen:'
    this.initStore()
  }

  initStore() {
    try {
      const client = getRedisClient()
      if (client) {
        this.redisStore = new RedisStore({
          sendCommand: async (...args) => {
            if (!isRedisHealthy()) {
              throw new Error('Redis is not ready')
            }
            logger.debug(`Redis rate limiter sendCommand args: ${JSON.stringify(args)}`)
            return client.call(...args)
          },
          prefix: this.prefix
        })
      }
    } catch (err) {
      logger.error('Failed to initialize RedisStore for rate limiting:', err)
    }
  }

  async increment(key) {
    if (!isRedisHealthy() || !this.redisStore) {
      return this.memoryStore.increment(key)
    }
    try {
      return await this.redisStore.increment(key)
    } catch (err) {
      logger.warn(`Redis rate limiter increment failed (Graceful fallback to memory): ${err.message}`)
      return this.memoryStore.increment(key)
    }
  }

  async decrement(key) {
    if (!isRedisHealthy() || !this.redisStore) {
      return this.memoryStore.decrement(key)
    }
    try {
      return await this.redisStore.decrement(key)
    } catch (err) {
      logger.warn(`Redis rate limiter decrement failed: ${err.message}`)
      return this.memoryStore.decrement(key)
    }
  }

  async resetKey(key) {
    if (!isRedisHealthy() || !this.redisStore) {
      return this.memoryStore.resetKey(key)
    }
    try {
      return await this.redisStore.resetKey(key)
    } catch (err) {
      logger.warn(`Redis rate limiter resetKey failed: ${err.message}`)
      return this.memoryStore.resetKey(key)
    }
  }
}

// Safe helper to resolve request IP in local environments and reverse proxies
const getRequestIp = (req) => {
  return req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
}

// Helper to create limiters with custom error responses
const createLimiter = (options) => {
  const { code, message, prefix, ...rateLimitOptions } = options
  return rateLimit({
    store: new GracefulRedisStore(prefix),
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
  prefix: 'rl:signup:',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many signup attempts from this network. Please try again after an hour.',
  code: 'RATE_LIMIT_SIGNUP',
  keyGenerator: (req) => getRequestIp(req) // IP-based limit
})

// 2. Auth Login: 10 attempts per 15 minutes per IP
export const authLoginLimiter = createLimiter({
  prefix: 'rl:login:',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many login attempts. Account protection lockout in place.',
  code: 'RATE_LIMIT_LOGIN',
  keyGenerator: (req) => getRequestIp(req)
})

// 3. OTP Send: 3 attempts per hour per request key (IP/Identity)
export const otpSendLimiter = createLimiter({
  prefix: 'rl:otp:',
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
  prefix: 'rl:vid:',
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  message: 'Maximum ID verification attempts reached for today.',
  code: 'RATE_LIMIT_VERIFY_ID'
})

// 5. Verify Face: 5 attempts per 24 hours per user
export const verifyFaceLimiter = createLimiter({
  prefix: 'rl:vface:',
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  message: 'Maximum face matching attempts reached for today.',
  code: 'RATE_LIMIT_VERIFY_FACE'
})

// 6. Create Activity: 10 posts per hour per user
export const createActivityLimiter = createLimiter({
  prefix: 'rl:cact:',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'You have reached the maximum number of activities you can post in an hour.',
  code: 'RATE_LIMIT_CREATE_ACTIVITY'
})

// 7. Join Activity: 20 requests per hour per user
export const joinActivityLimiter = createLimiter({
  prefix: 'rl:jact:',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many join requests sent. Take a breath and search some more feeds.',
  code: 'RATE_LIMIT_JOIN_ACTIVITY'
})

// 8. File Report: 5 filings per 24 hours per user
export const fileReportLimiter = createLimiter({
  prefix: 'rl:frpt:',
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  message: 'Maximum report filing attempts reached for today.',
  code: 'RATE_LIMIT_FILE_REPORT'
})

// 9. SOS Emergency: 3 trigger attempts per 10 minutes (always allowed but flags alerts)
export const sosLimiter = createLimiter({
  prefix: 'rl:sos:',
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: 'SOS trigger limit reached. Emergency contacts are already notified.',
  code: 'RATE_LIMIT_SOS'
})

// 10. General API Requests: 200 requests per minute
export const generalLimiter = createLimiter({
  prefix: 'rl:gen:',
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  message: 'Too many general requests. Rate limit throttle applied.',
  code: 'RATE_LIMIT_GENERAL'
})

// 11. Community Votes: 30 per minute per user
export const communityVoteLimiter = createLimiter({
  prefix: 'rl:cvote:',
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Vote limit reached. Please wait before voting again.',
  code: 'RATE_LIMIT_COMMUNITY_VOTE'
})

// 12. Community Posts: 10 per minute per user
export const communityPostLimiter = createLimiter({
  prefix: 'rl:cpost:',
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Post creation limit reached. Please wait before posting again.',
  code: 'RATE_LIMIT_COMMUNITY_POST'
})

// 13. Community Comments: 10 per minute per user
export const communityCommentLimiter = createLimiter({
  prefix: 'rl:ccomm:',
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Comment limit reached. Please wait before commenting again.',
  code: 'RATE_LIMIT_COMMUNITY_COMMENT'
})

// 14. Community Reports: 10 per hour per user
export const communityReportLimiter = createLimiter({
  prefix: 'rl:crept:',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Report limit reached. Please wait before submitting more reports.',
  code: 'RATE_LIMIT_COMMUNITY_REPORT'
})

// 15. Activity Discovery Search Limiter: 60 search/filter requests per minute per user/IP
export const discoverySearchLimiter = createLimiter({
  prefix: 'rl:disc:',
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: 'Too many search requests. Please wait a minute before searching or filtering again.',
  code: 'RATE_LIMIT_DISCOVERY_SEARCH'
})
