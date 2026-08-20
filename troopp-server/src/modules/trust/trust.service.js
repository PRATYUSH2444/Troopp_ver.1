import User from '../../models/User.js'
import TrustScoreLog from '../../models/TrustScoreLog.js'
import { sendNotification } from '../../services/notification.service.js'
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../../utils/cache.js'
import logger from '../../config/logger.js'

// Map scoring reasons to human-readable labels
const REASON_MAPPINGS = {
  id_verified: 'Identity verified (+30)',
  face_verified: 'Face match verified (+15)',
  phone_verified: 'Phone number verified (+20)',
  trip_completed: 'Trip completed successfully (+5)',
  positive_rating: 'Positive rating received (+3)',
  emergency_contact: 'Emergency contact added (+10)',
  account_tenure: 'Active member bonus (+1)',
  report_filed: 'Report filed against you (-20)',
  report_valid: 'Report confirmed valid (-40)'
}

/**
 * Fetch cached trust score with fallback database re-computation.
 */
export const getCachedTrustScore = async (userId) => {
  const cacheKey = `user:trust:${userId}`
  try {
    const cached = await cacheGet(cacheKey)
    if (cached !== null && cached !== undefined) {
      return parseInt(cached, 10)
    }
  } catch (err) {
    logger.warn(`Failed to read trust cache for user ${userId}: ${err.message}`)
  }

  const user = await User.findByPk(userId)
  if (!user) return 50

  const finalScore = Math.max(0, Math.min(100, user.trust_score))
  try {
    await cacheSet(cacheKey, finalScore, 600) // 10 minutes TTL
  } catch (err) {
    logger.warn(`Failed to set trust cache: ${err.message}`)
  }

  return finalScore
}

/**
 * Increment user's trust score, log transaction, and send notification.
 * @param {string} userId - User identifier
 * @param {number} amount - Score increment delta
 * @param {string} reason - Scoring event reason string
 * @param {string} [referenceId] - Associated activity or rater ID
 */
export const addTrustScore = async (userId, amount, reason, referenceId = null) => {
  try {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new Error(`Scoring failure: User ${userId} not found.`)
    }

    // Invalidate cached score
    await cacheInvalidatePattern(`user:trust:${userId}`)

    // 1. Ignore if scores are frozen (e.g. banned profiles)
    if (user.score_frozen) {
      logger.warn(`Ignore scoring update: User ${userId} trust score is frozen.`)
      return user.trust_score
    }

    const oldScore = user.trust_score
    const newScore = Math.min(100, oldScore + amount)
    const delta = newScore - oldScore

    if (delta <= 0) {
      return oldScore // Score already at max ceiling
    }

    // 2. Update user score
    user.trust_score = newScore
    await user.save()

    // 3. Log audit event
    await TrustScoreLog.create({
      user_id: userId,
      old_score: oldScore,
      new_score: newScore,
      delta: delta,
      reason,
      // Map reference ID to rater or activity context if available
      activity_id: reason === 'trip_completed' ? referenceId : null,
      rater_id: reason === 'positive_rating' ? referenceId : null
    })

    logger.info(`Trust score increased for ${user.email} by +${delta} points. Reason: ${reason}`)

    // 4. Send Notification
    const humanReason = REASON_MAPPINGS[reason] || `Bonus points (+${delta})`
    await sendNotification(userId, {
      type: 'trust_score_changed',
      title: 'Trust Score Increased! 📈',
      body: `Your Trust Score increased to ${newScore}/100. Reason: ${humanReason}`
    })

    return newScore
  } catch (error) {
    logger.error(`Error incrementing trust score for user ${userId}:`, error)
    throw error
  }
}

/**
 * Deduct user's trust score, log transaction, and notify user.
 * @param {string} userId - User identifier
 * @param {number} amount - Score deduction delta
 * @param {string} reason - Scoring event reason string
 * @param {string} [referenceId] - Associated activity or reporter ID
 */
export const deductTrustScore = async (userId, amount, reason, referenceId = null) => {
  try {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new Error(`Scoring failure: User ${userId} not found.`)
    }

    // Invalidate cached score
    await cacheInvalidatePattern(`user:trust:${userId}`)

    if (user.score_frozen) {
      return user.trust_score
    }

    const oldScore = user.trust_score
    const newScore = Math.max(0, oldScore - amount)
    const delta = oldScore - newScore

    if (delta <= 0) {
      return oldScore // Score already at floor limit
    }

    // Update user score
    user.trust_score = newScore
    await user.save()

    // Log audit event
    await TrustScoreLog.create({
      user_id: userId,
      old_score: oldScore,
      new_score: newScore,
      delta: -delta,
      reason,
      activity_id: referenceId
    })

    logger.warn(`Trust score decreased for ${user.email} by -${delta} points. Reason: ${reason}`)

    // Send Notification
    const humanReason = REASON_MAPPINGS[reason] || `Penalty points (-${delta})`
    await sendNotification(userId, {
      type: 'trust_score_changed',
      title: 'Trust Score Deducted ⚠️',
      body: `Your Trust Score decreased to ${newScore}/100. Reason: ${humanReason}`
    })

    return newScore
  } catch (error) {
    logger.error(`Error decrementing trust score for user ${userId}:`, error)
    throw error
  }
}


/**
 * Get formatted list of recent trust score events.
 * @param {string} userId - User identifier
 * @returns {Promise<Array>} history log list
 */
export const getTrustBreakdown = async (userId) => {
  try {
    const logs = await TrustScoreLog.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit: 10
    })

    return logs.map((log) => ({
      date: log.created_at,
      description: REASON_MAPPINGS[log.reason] || `Score Adjustment (${log.reason})`,
      change: log.delta > 0 ? `+${log.delta}` : `${log.delta}`,
      newScore: log.new_score
    }))
  } catch (error) {
    logger.error(`Failed to retrieve trust breakdown logs for user ${userId}:`, error)
    throw error
  }
}

/**
 * Freeze user scores during administrative blocks.
 */
export const freezeScore = async (userId) => {
  const user = await User.findByPk(userId)
  if (user) {
    user.score_frozen = true
    await user.save()
    logger.info(`Scoring engine locked for user: ${user.email}`)
  }
}
