import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import TokenBlacklist from '../models/TokenBlacklist.js'
import { AppError } from './errorHandler.middleware.js'
import logger from '../config/logger.js'
import { getRedisClient, isRedisHealthy } from '../config/redis.js'

/**
 * Middleware to protect routes. Verifies JWT Access token.
 * Verifies if user exists, token is not blacklisted, and account is active.
 */
export const protect = async (req, res, next) => {
  try {
    let token

    // 1. Extract Bearer token from headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return next(new AppError('Authentication failed: Missing token.', 401, 'JWT_MISSING'))
    }

    // 2. Check if token is blacklisted (logged out)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const isBlacklisted = await TokenBlacklist.findOne({ where: { token_hash: tokenHash } })

    if (isBlacklisted) {
      logger.warn(`Rejected blacklisted access token attempt. Hash: ${tokenHash}`)
      return next(new AppError('Authentication failed: Revoked token.', 401, 'JWT_REVOKED'))
    }

    // 3. Verify JWT Access token
    const secret = process.env.JWT_ACCESS_SECRET
    let decoded
    try {
      decoded = jwt.verify(token, secret, { algorithms: ['HS256'] })
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Session expired. Please request token refresh.', 401, 'JWT_EXPIRED'))
      }
      return next(new AppError('Invalid token.', 401, 'JWT_INVALID'))
    }

    // 4. Retrieve User from database (with Redis caching and graceful DB fallback)
    let user = null
    const cacheKey = `user:session:${decoded.id}`
    const redis = getRedisClient()

    if (isRedisHealthy() && redis) {
      try {
        const cachedUser = await redis.get(cacheKey)
        if (cachedUser) {
          user = User.build(JSON.parse(cachedUser), { isNewRecord: false })
        }
      } catch (cacheErr) {
        logger.error(`Graceful fallback: failed to fetch user from Redis cache: ${cacheErr.message}`)
      }
    }

    if (!user) {
      user = await User.findByPk(decoded.id)
      if (user && isRedisHealthy() && redis) {
        try {
          await redis.setex(cacheKey, 60, JSON.stringify(user.toJSON())) // 60s safety TTL
        } catch (cacheErr) {
          logger.error(`Failed to cache user session in Redis: ${cacheErr.message}`)
        }
      }
    }

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401, 'USER_NOT_FOUND'))
    }

    // 5. Verify User Account Status
    if (user.account_status === 'banned') {
      return next(new AppError(`Account banned. Reason: ${user.ban_reason || 'Terms of Service violation'}`, 403, 'USER_BANNED'))
    }

    if (user.account_status === 'suspended') {
      if (user.suspension_until && new Date() < new Date(user.suspension_until)) {
        const remainingTime = new Date(user.suspension_until) - new Date()
        const hours = Math.ceil(remainingTime / (1000 * 60 * 60))
        return next(new AppError(`Account suspended for ${hours} more hours.`, 403, 'USER_SUSPENDED'))
      } else {
        // Auto-restore status if suspension window has passed
        user.account_status = 'active'
        user.suspension_until = null
        await user.save()
      }
    }

    if (user.account_status === 'deactivated') {
      return next(new AppError('Account is currently deactivated. Please log in again to reactivate.', 403, 'USER_DEACTIVATED'))
    }

    // Attach verified user and token to request context
    req.user = user
    req.token = token

    // 6. Update user's last_active_at with a 2-minute write-throttle
    try {
      const throttleKey = `user:presence-throttle:${user.id}`
      let shouldUpdateDb = true
      if (isRedisHealthy() && redis) {
        const hasThrottle = await redis.get(throttleKey)
        if (hasThrottle) {
          shouldUpdateDb = false
        } else {
          await redis.setex(throttleKey, 120, '1')
        }
      }
      
      // Also register live user presence key for online status check (5-minute TTL)
      if (isRedisHealthy() && redis) {
        await redis.setex(`user:presence:${user.id}`, 300, 'online')
      }

      if (shouldUpdateDb) {
        // Run update in background (non-blocking)
        User.update({ last_active_at: new Date() }, { where: { id: user.id } }).catch(err => {
          logger.error(`Failed to update last_active_at: ${err.message}`)
        })
      }
    } catch (presenceErr) {
      logger.error(`Presence tracking error: ${presenceErr.message}`)
    }

    next()
  } catch (error) {
    logger.error('Error executing authentication protection guards:', error)
    next(new AppError('Authentication failed.', 500, 'AUTH_INTERNAL_ERROR'))
  }
}

/**
 * Middleware to restrict access to admin users only.
 * Must be mounted AFTER protect middleware.
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Access denied: Administrative privileges required.', 403, 'ADMIN_ACCESS_REQUIRED'))
  }
  next()
}

/**
 * Middleware to optionally resolve user from JWT if present.
 * Does not block/return 401 if token is missing or invalid.
 */
export const resolveUserOptional = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return next()
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const isBlacklisted = await TokenBlacklist.findOne({ where: { token_hash: tokenHash } })
    if (isBlacklisted) {
      return next()
    }

    const secret = process.env.JWT_ACCESS_SECRET
    let decoded
    try {
      decoded = jwt.verify(token, secret, { algorithms: ['HS256'] })
    } catch (err) {
      return next()
    }

    const user = await User.findByPk(decoded.id)
    if (user && user.account_status === 'active') {
      req.user = user
      req.token = token
    }
    next()
  } catch (error) {
    next()
  }
}

export const authGuard = protect
export default protect

