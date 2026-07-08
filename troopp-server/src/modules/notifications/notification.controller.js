import * as notificationService from './notification.service.js'
import NotificationPreference from '../../models/NotificationPreference.js'

/**
 * Handles REST actions for Push Tokens, Notifications lists, and Preference toggles.
 */

export const registerFCMToken = async (req, res, next) => {
  try {
    const { fcmToken, deviceLabel } = req.body
    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'FCM token is required.' })
    }
    const token = await notificationService.registerFCMToken(req.user.id, fcmToken, deviceLabel)
    res.status(200).json({
      success: true,
      message: 'FCM registration token saved successfully.',
      data: token
    })
  } catch (error) {
    next(error)
  }
}

export const getUserNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const list = await notificationService.getUserNotifications(req.user.id, page, limit)
    res.status(200).json({
      success: true,
      data: list.rows,
      total: list.count,
      page,
      limit
    })
  } catch (error) {
    next(error)
  }
}

export const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id)
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    })
  } catch (error) {
    next(error)
  }
}

export const updatePreferences = async (req, res, next) => {
  try {
    const updated = await notificationService.updatePreferences(req.user.id, req.body)
    res.status(200).json({
      success: true,
      message: 'Notification preference toggles updated.',
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

export const getPreferences = async (req, res, next) => {
  try {
    const [pref] = await NotificationPreference.findOrCreate({
      where: { user_id: req.user.id },
      defaults: {
        user_id: req.user.id,
        new_activities: true,
        trip_updates: true,
        join_updates: true,
        score_changes: true,
        social: true
      }
    })
    res.status(200).json({
      success: true,
      data: pref
    })
  } catch (error) {
    next(error)
  }
}
