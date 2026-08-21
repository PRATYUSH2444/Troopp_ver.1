import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import logger from '../config/logger.js'
import User from '../models/User.js'
import Profile from '../models/Profile.js'
import TokenBlacklist from '../models/TokenBlacklist.js'

/**
 * Socket.io authentication middleware.
 * Validates JWT access token, checks blacklist and user account status.
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1]

    if (!token) {
      logger.warn('Socket connection rejected: Token missing.')
      return next(new Error('UNAUTHORIZED'))
    }

    const secret = process.env.JWT_ACCESS_SECRET
    let decoded
    try {
      decoded = jwt.verify(token, secret)
    } catch (err) {
      logger.warn(`Socket connection rejected: Invalid JWT. ${err.message}`)
      return next(new Error('UNAUTHORIZED'))
    }

    // 1. Check blacklist
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const blacklisted = await TokenBlacklist.findOne({ where: { token_hash: tokenHash } })
    if (blacklisted) {
      logger.warn('Socket connection rejected: Token blacklisted.')
      return next(new Error('UNAUTHORIZED'))
    }

    // 2. Query user and check account status
    const user = await User.findByPk(decoded.id, { include: [{ model: Profile, as: 'Profile' }] })
    if (!user) {
      logger.warn(`Socket connection rejected: User not found in DB [ID: ${decoded.id}]`)
      return next(new Error('UNAUTHORIZED'))
    }

    if (user.account_status !== 'active') {
      logger.warn(`Socket connection rejected: Account status is ${user.account_status} [User: ${user.id}]`)
      return next(new Error('UNAUTHORIZED'))
    }

    // 3. Attach variables to socket data
    socket.data = {
      userId: user.id,
      role: user.role
    }
    socket.user = user // Backward compatibility

    logger.debug(`Socket client verified: User ${user.id} (${user.role})`)
    next()
  } catch (error) {
    logger.error('Socket authentication internal error:', error)
    return next(new Error('UNAUTHORIZED'))
  }
}

export default socketAuthMiddleware
export { socketAuthMiddleware }
