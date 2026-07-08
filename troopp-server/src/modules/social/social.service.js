import { Op } from 'sequelize'
import Follow from '../../models/Follow.js'
import BlockedUser from '../../models/BlockedUser.js'
import User from '../../models/User.js'
import Profile from '../../models/Profile.js'
import Activity from '../../models/Activity.js'
import ActivityMember from '../../models/ActivityMember.js'
import { AppError } from '../../middleware/errorHandler.middleware.js'
import * as notificationService from '../notifications/notification.service.js'
import logger from '../../config/logger.js'

/**
 * Follow another user. Triggers FCM push notification.
 */
export const followUser = async (followerId, followingId) => {
  if (followerId === followingId) {
    throw new AppError('You cannot follow yourself.', 400, 'SELF_FOLLOW')
  }

  const targetUser = await User.findByPk(followingId)
  if (!targetUser) {
    throw new AppError('Target user not found.', 404, 'USER_NOT_FOUND')
  }

  const [follow, created] = await Follow.findOrCreate({
    where: { follower_id: followerId, following_id: followingId }
  })

  if (created) {
    // Send FCM alert notification to the followed user
    const followerProfile = await Profile.findOne({ where: { user_id: followerId } })
    const title = 'New Follower! 👤'
    const body = `${followerProfile?.name || 'An explorer'} started following you on Troopp.`
    
    await notificationService.createNotificationRecord(followingId, 'user_followed', title, body, 'user', followerId)
    await notificationService.sendFCM(followingId, title, body, {
      type: 'user_followed',
      referenceType: 'user',
      referenceId: followerId
    })
  }

  return follow
}

/**
 * Unfollow a user.
 */
export const unfollowUser = async (followerId, followingId) => {
  return await Follow.destroy({
    where: { follower_id: followerId, following_id: followingId }
  })
}

/**
 * List followers of a user.
 */
export const getFollowers = async (userId) => {
  const list = await Follow.findAll({
    where: { following_id: userId },
    include: [
      {
        model: User,
        as: 'Follower',
        attributes: ['id', 'reliability_score'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'trust_score'] }]
      }
    ]
  })

  return list.map((f) => ({
    userId: f.Follower?.id,
    name: f.Follower?.Profile?.name || 'Explorer',
    avatarUrl: f.Follower?.Profile?.avatar_url,
    trustScore: f.Follower?.Profile?.trust_score || 80,
    reliabilityScore: f.Follower?.reliability_score || 100
  }))
}

/**
 * List users followed by a user.
 */
export const getFollowing = async (userId) => {
  const list = await Follow.findAll({
    where: { follower_id: userId },
    include: [
      {
        model: User,
        as: 'Following',
        attributes: ['id', 'reliability_score'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'trust_score'] }]
      }
    ]
  })

  return list.map((f) => ({
    userId: f.Following?.id,
    name: f.Following?.Profile?.name || 'Explorer',
    avatarUrl: f.Following?.Profile?.avatar_url,
    trustScore: f.Following?.Profile?.trust_score || 80,
    reliabilityScore: f.Following?.reliability_score || 100
  }))
}

/**
 * Block another user. Automatically processes shared future trips.
 */
export const blockUser = async (blockerId, blockedId) => {
  if (blockerId === blockedId) {
    throw new AppError('You cannot block yourself.', 400, 'SELF_BLOCK')
  }

  const [block, created] = await BlockedUser.findOrCreate({
    where: { blocker_id: blockerId, blocked_id: blockedId }
  })

  // Auto-remove any follow linkages in both directions
  await Follow.destroy({
    where: {
      [Op.or]: [
        { follower_id: blockerId, following_id: blockedId },
        { follower_id: blockedId, following_id: blockerId }
      ]
    }
  })

  const sharedTripsToPrompt = []

  // Check future trip scenarios
  const futureActivities = await Activity.findAll({
    where: {
      date_time: { [Op.gt]: new Date() },
      status: { [Op.ne]: 'cancelled' }
    }
  })

  const activityIds = futureActivities.map((a) => a.id)

  if (activityIds.length > 0) {
    // Scenario A: Blocker is member, Blocked is Host -> Auto-withdraw Blocker
    const activitiesHostedByBlocked = futureActivities.filter((a) => a.creator_id === blockedId).map((a) => a.id)
    if (activitiesHostedByBlocked.length > 0) {
      const affectedMemberships = await ActivityMember.findAll({
        where: {
          activity_id: { [Op.in]: activitiesHostedByBlocked },
          user_id: blockerId,
          status: 'confirmed'
        }
      })

      if (affectedMemberships.length > 0) {
        await ActivityMember.update(
          { status: 'withdrawn' },
          {
            where: {
              activity_id: { [Op.in]: activitiesHostedByBlocked },
              user_id: blockerId,
              status: 'confirmed'
            }
          }
        )
        logger.info(`[BLOCK AUTO-WITHDRAW]: User ${blockerId} withdrawn from trips hosted by blocked user ${blockedId}`)
      }
    }

    // Scenario B: Both are members in the same future trip hosted by User C -> Add to prompts list
    const thirdPartyActivities = futureActivities.filter((a) => a.creator_id !== blockerId && a.creator_id !== blockedId)
    const thirdPartyIds = thirdPartyActivities.map((a) => a.id)

    if (thirdPartyIds.length > 0) {
      for (const act of thirdPartyActivities) {
        const blockerConfirmed = await ActivityMember.findOne({
          where: { activity_id: act.id, user_id: blockerId, status: 'confirmed' }
        })
        const blockedConfirmed = await ActivityMember.findOne({
          where: { activity_id: act.id, user_id: blockedId, status: 'confirmed' }
        })

        if (blockerConfirmed && blockedConfirmed) {
          sharedTripsToPrompt.push({
            id: act.id,
            title: act.title,
            date_time: act.date_time
          })
        }
      }
    }
  }

  return {
    block,
    sharedTripsToPrompt
  }
}

/**
 * Unblock a user.
 */
export const unblockUser = async (blockerId, blockedId) => {
  return await BlockedUser.destroy({
    where: { blocker_id: blockerId, blocked_id: blockedId }
  })
}
