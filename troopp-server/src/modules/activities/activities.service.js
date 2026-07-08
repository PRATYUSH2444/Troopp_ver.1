import * as activityRepo from './activities.repository.js'
import { deductReliability, addReliability } from '../trust/reliability.service.js'
import { sendNotification } from '../../services/notification.service.js'
import logger from '../../config/logger.js'

/**
 * Get all activities by city.
 */
export const getAllByCity = async (filters, pagination) => {
  return await activityRepo.getAllByCity(filters, pagination)
}

/**
 * Get followed users' activities.
 */
export const getByFollowing = async (userId, pagination) => {
  return await activityRepo.getByFollowing(userId, pagination)
}

/**
 * Search activities.
 */
export const search = async (query, cityId, pagination) => {
  return await activityRepo.search(query, cityId, pagination)
}

/**
 * Get detailed activity with profile context and mutual links.
 */
export const getByIdWithDetails = async (id, requestingUserId) => {
  return await activityRepo.getByIdWithDetails(id, requestingUserId)
}

/**
 * Publish a new activity.
 */
export const create = async (creatorId, data) => {
  const result = await activityRepo.create(creatorId, data)
  
  // Send notification to host
  await sendNotification(creatorId, {
    type: 'activity_created',
    title: 'Trip Published! 🎒',
    body: `Your trip "${result.activity.title}" is live! Next: configure rules and waypoints.`
  })

  return result
}

/**
 * Update activity details.
 */
export const update = async (id, data, creatorId) => {
  return await activityRepo.update(id, data, creatorId)
}

/**
 * Cancel an activity, notifying all enrolled members.
 */
export const cancel = async (id, creatorId) => {
  const { activity, members } = await activityRepo.cancel(id, creatorId)

  // Notify each member of cancellation
  for (const member of members) {
    if (member.user_id !== creatorId) {
      await sendNotification(member.user_id, {
        type: 'activity_cancelled',
        title: 'Trip Cancelled ❌',
        body: `Host cancelled the trip: "${activity.title}".`
      })
    }
  }

  return activity
}

/**
 * Get pending join requests for host approval.
 */
export const getJoinRequests = async (activityId, creatorId) => {
  return await activityRepo.getJoinRequests(activityId, creatorId)
}

/**
 * Approve a user join request.
 */
export const approveJoin = async (activityId, requestId, creatorId) => {
  const { member, activity } = await activityRepo.approveJoin(activityId, requestId, creatorId)

  // Notify approved user
  await sendNotification(member.user_id, {
    type: 'join_request_approved',
    title: 'Join Request Approved! 🎉',
    body: `Awesome! The host approved your request to join: "${activity.title}".`
  })

  return member
}

/**
 * Decline a user join request.
 */
export const declineJoin = async (activityId, requestId, creatorId) => {
  const member = await activityRepo.declineJoin(activityId, requestId, creatorId)

  // Notify declined user
  await sendNotification(member.user_id, {
    type: 'join_request_declined',
    title: 'Join Request Declined',
    body: `The host declined your request to join: "${activityId}".`
  })

  return member
}

/**
 * Join an activity, checking gates.
 */
export const joinActivity = async (activityId, userId, intent) => {
  const { member, activity } = await activityRepo.joinActivity(activityId, userId, intent)

  // Notify Host of join request or confirmation
  await sendNotification(activity.creator_id, {
    type: 'new_join_request',
    title: 'New Member Applied 👤',
    body: `A member has requested to join your trip: "${activity.title}".`
  })

  return member
}

/**
 * Withdraw enrollment, assessing penalties under 24 hours.
 */
export const withdrawFromActivity = async (activityId, userId, reason) => {
  const { member, activity, isLateWithdrawal, promotedMember } = await activityRepo.withdrawFromActivity(activityId, userId, reason)

  // 1. If withdrawal is late (under 24h notice), deduct -10 reliability points
  if (isLateWithdrawal) {
    await deductReliability(userId, 10, 'late_withdrawal', activityId)
  }

  // 2. Notify Host
  await sendNotification(activity.creator_id, {
    type: 'member_withdrawn',
    title: 'Member Withdrew 🚶',
    body: `A member has left your trip: "${activity.title}".`
  })

  // 3. Notify promoted waitlist member
  if (promotedMember) {
    await sendNotification(promotedMember.user_id, {
      type: 'waitlist_promoted',
      title: 'Promoted from Waitlist! 🎉',
      body: `Spot opened! You have been promoted to confirmed status on: "${activity.title}".`
    })
  }

  return { member, isLateWithdrawal }
}

/**
 * Fetch behavioral metrics for member trust card review.
 */
export const getMemberTrustCard = async (userId, requestingUserId) => {
  return await activityRepo.getMemberTrustCard(userId, requestingUserId)
}
