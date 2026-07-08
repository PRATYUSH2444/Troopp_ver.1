import { Op } from 'sequelize'
import Notification from '../../models/Notification.js'
import UserFCMToken from '../../models/UserFCMToken.js'
import NotificationPreference from '../../models/NotificationPreference.js'
import admin from '../../config/firebase.js'
import logger from '../../config/logger.js'

/**
 * Maps the 28 predefined notification types to preference category columns.
 */
export const getPreferenceCategory = (notificationType) => {
  switch (notificationType) {
    case 'new_activity_in_city':
      return 'new_activities'

    case 'join_request_received':
    case 'join_request_approved':
    case 'join_request_declined':
    case 'waitlist_promoted':
    case 'member_withdrew':
    case 'member_kicked':
      return 'join_updates'

    case 'trip_announcement':
    case 'activity_cancelled':
    case 'activity_updated':
    case 'rating_prompt':
      return 'trip_updates'

    case 'trust_score_changed':
    case 'reliability_score_changed':
      return 'score_changes'

    case 'user_followed':
      return 'social'

    case 'sos_triggered':
    case 'emergency_alert':
    case 'checkin_missed':
      return 'safety'

    case 'admin_broadcast':
    case 'system_update':
      return 'admin_broadcasts'

    default:
      return 'trip_updates'
  }
}

/**
 * Helper mapping notification keys to URL client path endpoints.
 */
export const getDeepLink = (type, referenceId) => {
  switch (type) {
    case 'new_activity_in_city':
      return `/activities/${referenceId}`
    case 'join_request_received':
      return `/activities/${referenceId}/requests`
    case 'join_request_approved':
      return `/trip-rooms/${referenceId}`
    case 'trip_announcement':
      return `/trip-rooms/${referenceId}`
    case 'rating_prompt':
      return `/activities/${referenceId}/rate`
    case 'trust_score_changed':
      return '/profile/me'
    case 'checkin_missed':
    case 'sos_triggered':
      return `/trip-rooms/${referenceId}`
    default:
      return '/feed'
  }
}

/**
 * Insert a notification record in the database for history log.
 */
export const createNotificationRecord = async (userId, type, title, body, referenceType = '', referenceId = '') => {
  try {
    const record = await Notification.create({
      user_id: userId,
      type,
      title,
      body,
      is_read: false,
      data: {
        referenceType,
        referenceId,
        deepLink: getDeepLink(type, referenceId)
      }
    })
    return record
  } catch (error) {
    logger.error('Failed creating notification record in DB:', error)
    return null
  }
}

/**
 * Checks if a user has enabled notifications for a specific type.
 */
export const checkNotificationPreference = async (userId, type) => {
  const category = getPreferenceCategory(type)
  if (category === 'safety' || category === 'admin_broadcasts') {
    return true // Always enabled, cannot disable
  }

  try {
    const [pref] = await NotificationPreference.findOrCreate({
      where: { user_id: userId },
      defaults: {
        user_id: userId,
        new_activities: true,
        trip_updates: true,
        join_updates: true,
        score_changes: true,
        social: true
      }
    })
    return pref[category] !== false
  } catch (error) {
    logger.error(`Error checking notification preferences for user ${userId}:`, error)
    return true // Default fallback if fetch fails
  }
}

/**
 * Send FCM push notifications to user devices.
 * Supports string userId or array of userIds.
 */
export const sendFCM = async (userIds, title, body, payloadData = {}) => {
  const ids = Array.isArray(userIds) ? userIds : [userIds]
  if (ids.length === 0) return

  try {
    // 1. Filter users based on notification preference toggles
    const eligibleUserIds = []
    for (const userId of ids) {
      const isEnabled = await checkNotificationPreference(userId, payloadData.type)
      if (isEnabled) {
        eligibleUserIds.push(userId)
      }
    }

    if (eligibleUserIds.length === 0) return

    // 2. Fetch active FCM tokens for eligible users
    const fcmRecords = await UserFCMToken.findAll({
      where: { user_id: { [Op.in]: eligibleUserIds } },
      attributes: ['fcm_token']
    })

    const tokens = fcmRecords.map((r) => r.fcm_token)
    if (tokens.length === 0) {
      logger.debug(`No FCM registration tokens found for users: ${eligibleUserIds.join(', ')}`)
      return
    }

    // 3. Compile FCM message payload
    const deepLinkPath = getDeepLink(payloadData.type, payloadData.referenceId)
    const fcmPayload = {
      notification: { title, body },
      data: {
        type: payloadData.type || 'general',
        referenceType: payloadData.referenceType || '',
        referenceId: payloadData.referenceId || '',
        deepLink: deepLinkPath
      }
    }

    // 4. Dispatch multicast messages
    if (admin) {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...fcmPayload
      })

      logger.info(`[FCM SUCCESS]: Dispatched multicast notification. Success: ${response.successCount}, Failures: ${response.failureCount}`)

      // 5. Prune invalid/unregistered tokens
      if (response.failureCount > 0) {
        const tokensToRemove = []
        response.responses.forEach((res, idx) => {
          if (!res.success) {
            const errCode = res.error?.code
            if (
              errCode === 'messaging/registration-token-not-registered' ||
              errCode === 'messaging/invalid-registration-token'
            ) {
              tokensToRemove.push(tokens[idx])
            }
          }
        })

        if (tokensToRemove.length > 0) {
          await UserFCMToken.destroy({ where: { fcm_token: tokensToRemove } })
          logger.info(`[FCM PRUNE]: Removed ${tokensToRemove.length} unregistered/dead tokens.`)
        }
      }
    } else {
      // Mock logs fallback
      logger.info(`[FCM MOCK LOGS] Send multicast to: [${tokens.join(', ')}]. Payload:`, fcmPayload)
    }
  } catch (error) {
    logger.error('Failed sending FCM push notification:', error)
  }
}

/**
 * Register/save user FCM device tokens.
 */
export const registerFCMToken = async (userId, fcmToken, deviceLabel = '') => {
  const [tokenRecord, created] = await UserFCMToken.findOrCreate({
    where: { user_id: userId, fcm_token: fcmToken },
    defaults: { device_label: deviceLabel }
  })

  if (!created) {
    tokenRecord.last_used_at = new Date()
    await tokenRecord.save()
  }

  return tokenRecord
}

/**
 * Mark all user notifications as read.
 */
export const markAllAsRead = async (userId) => {
  return await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { user_id: userId, is_read: false } }
  )
}

/**
 * Retrieve paginated notifications history log for a user.
 */
export const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit
  return await Notification.findAndCountAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  })
}

/**
 * Save user notification toggle preferences.
 */
export const updatePreferences = async (userId, preferences) => {
  const [pref] = await NotificationPreference.findOrCreate({
    where: { user_id: userId }
  })

  // Prevent disabling safety & admin_broadcasts
  const updatedData = { ...preferences }
  delete updatedData.safety
  delete updatedData.admin_broadcasts

  Object.assign(pref, updatedData)
  return await pref.save()
}
