import IPBlock from '../models/IPBlock.js'
import { AppError } from './errorHandler.middleware.js'
import logger from '../config/logger.js'

/**
 * Middleware to check client IP address against blocked database entries.
 * Rejects connections immediately with 403 Forbidden if blocked.
 */
const ipBlockMiddleware = async (req, res, next) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress

    if (clientIp) {
      const isBlocked = await IPBlock.isBlocked(clientIp)
      if (isBlocked) {
        logger.warn(`Rejected connection attempt from blocked IP: ${clientIp}`)
        return next(new AppError('Your IP address is suspended from accessing Troopp.', 403, 'IP_BLOCKED'))
      }
    }
    next()
  } catch (error) {
    logger.error('Error executing IP block middleware check:', error)
    next() // Proceed so DB issues do not completely lock out clients
  }
}

export default ipBlockMiddleware
