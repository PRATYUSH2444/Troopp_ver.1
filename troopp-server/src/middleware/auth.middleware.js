import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import TokenBlacklist from '../models/TokenBlacklist.js'
import { AppError } from './errorHandler.middleware.js'
import logger from '../config/logger.js'

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
    const secret = process.env.JWT_ACCESS_SECRET || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    let decoded
    try {
      decoded = jwt.verify(token, secret)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Session expired. Please request token refresh.', 401, 'JWT_EXPIRED'))
      }
      return next(new AppError('Invalid token.', 401, 'JWT_INVALID'))
    }

    // 4. Retrieve User from database
    const user = await User.findByPk(decoded.id)
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
export const authGuard = protect
export default protect

