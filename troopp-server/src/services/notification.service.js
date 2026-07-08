import logger from '../config/logger.js'
import Notification from '../models/Notification.js'

/**
 * Send an in-app and push notification to a user.
 * Writes record directly to notifications DB table.
 * @param {string} userId - Target user ID
 * @param {Object} payload - Notification payload { type, title, body, data }
 */
export const sendNotification = async (userId, { type, title, body, data = {} }) => {
  try {
    // 1. Create database notification record
    const dbNotif = await Notification.create({
      user_id: userId,
      type,
      title,
      body,
      data,
      is_read: false
    })

    // 2. Dispatch real-time Socket push event (if namespace active)
    logger.info(`[NOTIFICATION]: Sent Alert to user: ${userId}. Type: ${type}. Title: ${title}`)
    
    // We will expand on Socket integration in Phase 5
    return dbNotif
  } catch (error) {
    logger.error(`Failed to send notification to ${userId}:`, error)
    return null
  }
}

/**
 * Dispatch system-wide administrative notifications.
 */
export const broadcastNotification = async ({ type, title, body, data = {} }) => {
  logger.info(`[BROADCAST NOTIFICATION]: Broadcast to all. Type: ${type}. Title: ${title}`)
}
