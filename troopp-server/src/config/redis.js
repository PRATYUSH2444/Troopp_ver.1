import Redis from 'ioredis'
import logger from './logger.js'

let redisClient = null

/**
 * Initialize and get the shared Redis client instance.
 */
export const getRedisClient = () => {
  if (redisClient) {
    return redisClient
  }

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy(times) {
        // Ephemeral reconnect strategy with max 2s delay
        const delay = Math.min(times * 50, 2000)
        return delay
      }
    })

    redisClient.on('connect', () => {
      logger.info('Connecting to Redis...')
    })

    redisClient.on('ready', () => {
      logger.info('Redis connection established successfully.')
    })

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err)
    })

    return redisClient
  } catch (error) {
    logger.error('Failed to initialize Redis client:', error)
    return null
  }
}

/**
 * Helper to check connection health.
 */
export const isRedisHealthy = () => {
  return redisClient && redisClient.status === 'ready'
}

export default getRedisClient
