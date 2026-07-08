import sequelize from '../../config/db.js'
import Rating from '../../models/Rating.js'
import Activity from '../../models/Activity.js'
import ActivityMember from '../../models/ActivityMember.js'
import TrustScoreLog from '../../models/TrustScoreLog.js'
import ReliabilityScoreLog from '../../models/ReliabilityScoreLog.js'
import Notification from '../../models/Notification.js'
import User from '../../models/User.js'
import Profile from '../../models/Profile.js'
import { AppError } from '../../middleware/errorHandler.middleware.js'
import * as trustService from '../trust/trust.service.js'
import * as reliabilityService from '../trust/reliability.service.js'
import logger from '../../config/logger.js'

/**
 * Submit co-traveler ratings for a completed activity in a single transaction.
 */
export const submitRatings = async (activityId, raterId, ratingsArray) => {
  const activity = await Activity.findByPk(activityId)
  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  // 1. Verify activity status is completed
  if (activity.status !== 'completed') {
    throw new AppError('Ratings can only be submitted for completed activities.', 400, 'TRIP_NOT_COMPLETED')
  }

  // 2. Verify rater was confirmed member
  const raterMember = await ActivityMember.findOne({
    where: { activity_id: activityId, user_id: raterId, status: 'confirmed' }
  })
  if (!raterMember) {
    throw new AppError('Access denied: You must be a confirmed participant to rate.', 403, 'NOT_PARTICIPANT')
  }

  // 3. Verify rating window open (activity.date_time + 48hr > now)
  const tripTime = new Date(activity.date_time).getTime()
  const windowExpiry = tripTime + 48 * 60 * 60 * 1000
  if (Date.now() > windowExpiry) {
    throw new AppError('The 48-hour rating window has closed.', 400, 'WINDOW_CLOSED')
  }

  // 4. Verify no existing ratings from this rater for this activity
  const existingRating = await Rating.findOne({
    where: { activity_id: activityId, rater_id: raterId }
  })
  if (existingRating) {
    throw new AppError('You have already submitted ratings for this activity.', 409, 'ALREADY_RATED')
  }

  // 5. Submit ratings in transaction
  const t = await sequelize.transaction()
  try {
    const ratingsCreated = []
    for (const r of ratingsArray) {
      const { ratee_id, respectful, follow_decisions, comfortable, travel_again, showed_up = true, comment = '' } = r

      // Map 4 params to columns
      const respScore = respectful ? 5 : 1
      const safetyScore = (follow_decisions && comfortable) ? 5 : (follow_decisions || comfortable) ? 3 : 1
      const overallScore = travel_again === 'yes' ? 5 : travel_again === 'maybe' ? 3 : 1

      const rating = await Rating.create({
        activity_id: activityId,
        rater_id: raterId,
        ratee_id,
        showed_up,
        respectful: respScore,
        safety_vibe: safetyScore,
        overall_rating: overallScore,
        comment
      }, { transaction: t })

      ratingsCreated.push({ rating, respectful, follow_decisions, comfortable, travel_again })
    }
    await t.commit()

    // 6. Process positive score rewards & negative alert warnings outside transaction
    for (const r of ratingsCreated) {
      const { rating, respectful, follow_decisions, comfortable, travel_again } = r

      // Check if positive: all 4 params are true
      const isPositive = respectful === true &&
        follow_decisions === true &&
        comfortable === true &&
        (travel_again === 'yes' || travel_again === 'maybe')

      if (isPositive) {
        await aggregateRatingUpdate(rating.ratee_id, activityId, true)
      }

      // Check if completely negative: all 4 params false/no
      const isNegative = respectful === false &&
        follow_decisions === false &&
        comfortable === false &&
        travel_again === 'no'

      if (isNegative) {
        // Count negative ratings for this ratee on this activity from different raters
        // We find all ratings for this user where respectful=1, safety_vibe=1, overall_rating=1
        const negativeCount = await Rating.count({
          where: {
            activity_id: activityId,
            ratee_id: rating.ratee_id,
            respectful: 1,
            safety_vibe: 1,
            overall_rating: 1
          }
        })

        // Trigger admin notification if >= 2 negative ratings received
        if (negativeCount >= 2) {
          const user = await User.findByPk(rating.ratee_id)
          const profile = await Profile.findOne({ where: { user_id: rating.ratee_id } })
          
          await Notification.create({
            user_id: rating.ratee_id,
            type: 'admin_flag',
            title: '⚠️ Negative Behavioral Alert',
            body: `User ${profile?.name || 'Explorer'} received multiple negative safety ratings on trip: ${activity.title}.`
          })
          logger.warn(`[ADMIN ALERT] High negative behavioral ratings flagged for User: ${rating.ratee_id}`)
        }
      }
    }

    return { success: true }
  } catch (error) {
    await t.rollback()
    logger.error('Submit ratings transaction failed:', error)
    throw error
  }
}

/**
 * Score Rewards: Bumps Trust and Reliability scores only once per trip per user.
 */
export const aggregateRatingUpdate = async (userId, activityId, isPositive) => {
  if (!isPositive) return

  // Query if a score log already exists for this activity to prevent double rewards
  const existingLog = await TrustScoreLog.findOne({
    where: { user_id: userId, activity_id: activityId, reason: 'rating_positive' }
  })

  if (!existingLog) {
    logger.info(`Applying positive ratings reward to User: ${userId} for Trip: ${activityId}`)
    
    // Add trust score (+3)
    await trustService.addTrustScore(userId, 3, 'rating_positive', activityId)
    
    // Add reliability score (+3)
    const user = await User.findByPk(userId)
    if (user) {
      const oldRel = user.reliability_score
      const newRel = Math.min(100, oldRel + 3)
      user.reliability_score = newRel
      await user.save()

      await ReliabilityScoreLog.create({
        user_id: userId,
        old_score: oldRel,
        new_score: newRel,
        delta: 3,
        reason: 'rating_positive',
        activity_id: activityId
      })
    }
  }
}

/**
 * Returns confirmed participants list for rating form.
 */
export const getRateableMembers = async (activityId, currentUserId) => {
  const members = await ActivityMember.findAll({
    where: {
      activity_id: activityId,
      status: 'confirmed',
      user_id: { [Op.ne]: currentUserId } // Exclude the rater themselves
    },
    include: [
      {
        model: User,
        as: 'User',
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
      }
    ]
  })

  return members.map((m) => ({
    userId: m.user_id,
    name: m.User?.Profile?.name || 'Explorer',
    avatarUrl: m.User?.Profile?.avatar_url
  }))
}
