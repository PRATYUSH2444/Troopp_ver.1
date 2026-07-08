import User from '../../models/User.js'
import ReliabilityScoreLog from '../../models/ReliabilityScoreLog.js'
import { sendNotification } from '../../services/notification.service.js'
import logger from '../../config/logger.js'

const REASON_MAPPINGS = {
  trip_attended: 'Trip attended as committed (+5)',
  positive_host_rating: 'Positive host rating received (+3)',
  late_withdrawal: 'Withdrew under 24 hours notice (-10)',
  no_show: 'Failed to show up at event (-20)'
}

/**
 * Increment user's reliability score, log audit entry, and notify user.
 * @param {string} userId - User identifier
 * @param {number} amount - Score increment delta
 * @param {string} reason - Reliability scoring reason
 * @param {string} [activityId] - Associated activity ID
 */
export const addReliability = async (userId, amount, reason, activityId = null) => {
  try {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new Error(`Scoring failure: User ${userId} not found.`)
    }

    if (user.score_frozen) {
      return user.reliability_score
    }

    const oldScore = user.reliability_score
    const newScore = Math.min(100, oldScore + amount)
    const delta = newScore - oldScore

    if (delta <= 0) {
      return oldScore
    }

    user.reliability_score = newScore
    await user.save()

    await ReliabilityScoreLog.create({
      user_id: userId,
      old_score: oldScore,
      new_score: newScore,
      delta: delta,
      reason,
      activity_id: activityId
    })

    logger.info(`Reliability score increased for ${user.email} by +${delta} points. Reason: ${reason}`)

    const humanReason = REASON_MAPPINGS[reason] || `Reliability bonus (+${delta})`
    await sendNotification(userId, {
      type: 'reliability_score_changed',
      title: 'Reliability Score Increased! 📈',
      body: `Your Reliability Score increased to ${newScore}/100. Reason: ${humanReason}`
    })

    return newScore
  } catch (error) {
    logger.error(`Error incrementing reliability score for user ${userId}:`, error)
    throw error
  }
}

/**
 * Deduct user's reliability score, log audit entry, and notify user.
 * @param {string} userId - User identifier
 * @param {number} amount - Score deduction delta
 * @param {string} reason - Reliability scoring reason
 * @param {string} [activityId] - Associated activity ID
 */
export const deductReliability = async (userId, amount, reason, activityId = null) => {
  try {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new Error(`Scoring failure: User ${userId} not found.`)
    }

    if (user.score_frozen) {
      return user.reliability_score
    }

    const oldScore = user.reliability_score
    const newScore = Math.max(0, oldScore - amount)
    const delta = oldScore - newScore

    if (delta <= 0) {
      return oldScore
    }

    user.reliability_score = newScore
    await user.save()

    await ReliabilityScoreLog.create({
      user_id: userId,
      old_score: oldScore,
      new_score: newScore,
      delta: -delta,
      reason,
      activity_id: activityId
    })

    logger.warn(`Reliability score decreased for ${user.email} by -${delta} points. Reason: ${reason}`)

    const humanReason = REASON_MAPPINGS[reason] || `Reliability deduction (-${delta})`
    await sendNotification(userId, {
      type: 'reliability_score_changed',
      title: 'Reliability Score Deducted ⚠️',
      body: `Your Reliability Score decreased to ${newScore}/100. Reason: ${humanReason}`
    })

    return newScore
  } catch (error) {
    logger.error(`Error decrementing reliability score for user ${userId}:`, error)
    throw error
  }
}
