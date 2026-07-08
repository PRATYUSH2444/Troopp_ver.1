import { Op } from 'sequelize'
import Activity from '../models/Activity.js'
import ActivityMember from '../models/ActivityMember.js'
import * as notificationService from '../modules/notifications/notification.service.js'
import logger from '../config/logger.js'

/**
 * Job to send rating prompts to confirmed members of completed activities.
 * Runs every 15 minutes.
 */
export const runSendRatingPrompts = async () => {
  const timestamp = new Date().toISOString()
  logger.info(`[JOB START] sendRatingPrompts at ${timestamp}`)

  try {
    const activities = await Activity.findAll({
      where: {
        status: 'completed',
        rating_prompt_sent: false
      }
    })

    if (activities.length === 0) {
      logger.info('[JOB END] sendRatingPrompts: 0 prompts sent.')
      return
    }

    let promptCount = 0

    for (const activity of activities) {
      const members = await ActivityMember.findAll({
        where: {
          activity_id: activity.id,
          status: 'confirmed'
        }
      })

      const memberUserIds = members.map((m) => m.user_id)

      for (const userId of memberUserIds) {
        // Verify notification preferences before sending
        const preferenceEnabled = await notificationService.checkNotificationPreference(userId, 'rating_prompt')
        
        if (preferenceEnabled) {
          await notificationService.createNotificationRecord(
            userId,
            'rating_prompt',
            '⭐️ Rate your co-travelers!',
            `How was your trip "${activity.title}"? Share feedback for your group members.`,
            'activity',
            activity.id
          )

          await notificationService.sendFCM(
            userId,
            '⭐️ Rate your co-travelers!',
            `Submit ratings for your group members in "${activity.title}".`,
            {
              type: 'rating_prompt',
              referenceType: 'activity',
              referenceId: activity.id,
              deepLink: `/ratings/${activity.id}`
            }
          )
        }
      }

      activity.rating_prompt_sent = true
      await activity.save()
      promptCount++
    }

    logger.info(`[JOB END] sendRatingPrompts: Prompts sent for ${promptCount} activities.`)
  } catch (error) {
    logger.error('[JOB ERROR] sendRatingPrompts failed:', error)
  }
}
