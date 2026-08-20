import * as activityRepo from './activities.repository.js'
import { deductReliability, addReliability } from '../trust/reliability.service.js'
import { sendNotification } from '../../services/notification.service.js'
import { cacheGet, cacheSet, cacheInvalidatePattern } from '../../utils/cache.js'
import logger from '../../config/logger.js'

/**
 * Get all activities by city (cached).
 */
export const getAllByCity = async (filters, pagination) => {
  const cacheKey = `feed:list:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`
  const cached = await cacheGet(cacheKey)
  if (cached) return cached

  const result = await activityRepo.getAllByCity(filters, pagination)
  await cacheSet(cacheKey, result, 300) // 5 minutes TTL
  return result
}

/**
 * Get followed users' activities (cached).
 */
export const getByFollowing = async (userId, pagination) => {
  const cacheKey = `feed:following:${userId}:${JSON.stringify(pagination)}`
  const cached = await cacheGet(cacheKey)
  if (cached) return cached

  const result = await activityRepo.getByFollowing(userId, pagination)
  await cacheSet(cacheKey, result, 300)
  return result
}

/**
 * Search activities (cached).
 */
export const search = async (query, cityId, pagination) => {
  const cacheKey = `feed:search:${query}:${cityId || 'all'}:${JSON.stringify(pagination)}`
  const cached = await cacheGet(cacheKey)
  if (cached) return cached

  const result = await activityRepo.search(query, cityId, pagination)
  await cacheSet(cacheKey, result, 300)
  return result
}

/**
 * Get detailed activity with profile context.
 */
export const getByIdWithDetails = async (id, requestingUserId) => {
  return await activityRepo.getByIdWithDetails(id, requestingUserId)
}

/**
 * Publish a new activity.
 */
export const create = async (creatorId, data) => {
  const result = await activityRepo.create(creatorId, data)
  await cacheInvalidatePattern('feed:*')

  // Socket broadcast of new activity
  if (global.io) {
    global.io.emit('activity_created', result.activity)
  }

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
  const activity = await activityRepo.update(id, data, creatorId)
  await cacheInvalidatePattern('feed:*')

  // Socket broadcast of updated activity details
  if (global.io) {
    global.io.emit('activity_updated', activity)
  }

  return activity
}

/**
 * Cancel an activity.
 */
export const cancel = async (id, creatorId) => {
  const { activity, members } = await activityRepo.cancel(id, creatorId)
  await cacheInvalidatePattern('feed:*')

  // Socket broadcast status update
  if (global.io) {
    global.io.emit('activity_updated', { id, status: 'cancelled' })
  }

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
 * Get pending join requests.
 */
export const getJoinRequests = async (activityId, creatorId) => {
  return await activityRepo.getJoinRequests(activityId, creatorId)
}

/**
 * Approve a user join request.
 */
export const approveJoin = async (activityId, requestId, creatorId) => {
  const { member, activity } = await activityRepo.approveJoin(activityId, requestId, creatorId)
  await cacheInvalidatePattern('feed:*')

  // Broadcast real-time slot update
  if (global.io) {
    global.io.emit('activity_updated', {
      id: activityId,
      current_members: activity.current_members,
      status: activity.status
    })
  }

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
  const { member, activity } = await activityRepo.declineJoin(activityId, requestId, creatorId)
  return member
}

/**
 * Primary join gateway.
 */
export const joinActivity = async (activityId, userId, intent, role, message) => {
  const { member, activity } = await activityRepo.joinActivity(activityId, userId, intent, role)

  if (member.status === 'confirmed') {
    await cacheInvalidatePattern('feed:*')
    // Broadcast slots update
    if (global.io) {
      global.io.emit('activity_updated', {
        id: activityId,
        current_members: activity.current_members,
        status: activity.status
      })
    }
  }

  let bodyText = `A member has requested to join your trip: "${activity.title}".`
  if (role && role !== 'member') {
    bodyText += ` Role Intent: ${role}.`
  }
  if (message) {
    bodyText += ` Message: "${message}"`
  }

  await sendNotification(activity.creator_id, {
    type: 'new_join_request',
    title: 'New Member Applied 👤',
    body: bodyText,
    data: {
      deepLink: `/activities/${activityId}/requests`
    }
  })

  return member
}

/**
 * Withdraw enrollment, promoting waitlist if spots open.
 */
export const withdrawFromActivity = async (activityId, userId, reason) => {
  const { member, activity, isLateWithdrawal, promotedMember } = await activityRepo.withdrawFromActivity(activityId, userId, reason)
  await cacheInvalidatePattern('feed:*')

  // Broadcast slots update to all clients
  if (global.io) {
    global.io.emit('activity_updated', {
      id: activityId,
      current_members: activity.current_members,
      status: activity.status
    })
  }

  if (isLateWithdrawal) {
    await deductReliability(userId, 10, 'late_withdrawal', activityId)
  }

  await sendNotification(activity.creator_id, {
    type: 'member_withdrawn',
    title: 'Member Withdrew 🚶',
    body: `A member has left your trip: "${activity.title}".`
  })

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
 * Fetch behavioral metrics.
 */
export const getMemberTrustCard = async (userId, requestingUserId) => {
  return await activityRepo.getMemberTrustCard(userId, requestingUserId)
}

/**
 * Publish trip setup draft.
 */
export const publish = async (id, creatorId, data) => {
  const activity = await activityRepo.publish(id, creatorId, data)
  await cacheInvalidatePattern('feed:*')

  if (global.io) {
    global.io.emit('activity_created', activity)
  }

  await sendNotification(creatorId, {
    type: 'activity_created',
    title: 'Trip Published! 🎒',
    body: `Your trip "${activity.title}" is live! Next: configure rules and waypoints.`
  })

  return activity
}

/**
 * Accept host invite.
 */
export const acceptHostingInvite = async (id, hostId) => {
  const { activity, member } = await activityRepo.acceptHostingInvite(id, hostId)
  await cacheInvalidatePattern('feed:*')

  if (global.io) {
    global.io.emit('activity_updated', activity)
  }

  await sendNotification(activity.creator_id, {
    type: 'host_invite_accepted',
    title: 'Host Invitation Accepted! 🤝',
    body: `Awesome! The assigned host accepted your invitation to host "${activity.title}".`
  })

  return { activity, member }
}

/**
 * Decline host invite.
 */
export const declineHostingInvite = async (id, hostId) => {
  const activity = await activityRepo.declineHostingInvite(id, hostId)
  await sendNotification(activity.creator_id, {
    type: 'host_invite_declined',
    title: 'Host Invitation Declined',
    body: `The assigned host declined your invitation to host "${activity.title}".`
  })
  return activity
}
