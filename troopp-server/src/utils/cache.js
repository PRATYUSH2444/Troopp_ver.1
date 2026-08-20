import { getRedisClient, isRedisHealthy } from '../config/redis.js'
import logger from '../config/logger.js'

class LocalMemoryStore {
  constructor() {
    this.cache = new Map()
  }

  get(key) {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.value
  }

  set(key, value, ttlSeconds) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    })
  }

  delete(key) {
    this.cache.delete(key)
  }

  clearPattern(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'))
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }
}

const memoryStore = new LocalMemoryStore()

export const cacheGet = async (key) => {
  if (!isRedisHealthy()) {
    const val = memoryStore.get(key)
    if (val) logger.debug(`Cache HIT (Local Memory): ${key}`)
    return val
  }
  try {
    const client = getRedisClient()
    const raw = await client.get(key)
    if (raw) {
      logger.debug(`Cache HIT (Redis): ${key}`)
      return JSON.parse(raw)
    }
    return null
  } catch (err) {
    logger.warn(`Redis get cache failed, fallback to memory: ${err.message}`)
    return memoryStore.get(key)
  }
}

export const cacheSet = async (key, value, ttlSeconds = 300) => {
  const jsonString = JSON.stringify(value)
  if (!isRedisHealthy()) {
    memoryStore.set(key, value, ttlSeconds)
    return
  }
  try {
    const client = getRedisClient()
    await client.set(key, jsonString, 'EX', ttlSeconds)
  } catch (err) {
    logger.warn(`Redis set cache failed, fallback to memory: ${err.message}`)
    memoryStore.set(key, value, ttlSeconds)
  }
}

export const cacheInvalidatePattern = async (pattern) => {
  // Always clear local memory store first
  memoryStore.clearPattern(pattern)

  if (!isRedisHealthy()) return
  try {
    const client = getRedisClient()
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(...keys)
      logger.debug(`Cache keys invalidated: ${keys.join(', ')}`)
    }
  } catch (err) {
    logger.warn(`Redis cache pattern invalidation failed: ${err.message}`)
  }
}
