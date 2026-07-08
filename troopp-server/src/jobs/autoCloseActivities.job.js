import { Op } from 'sequelize'
import Activity from '../models/Activity.js'
import logger from '../config/logger.js'

/**
 * Job to close activities whose registration window has expired.
 * Runs every minute (* * * * *).
 */
export const runAutoCloseActivities = async () => {
  const timestamp = new Date().toISOString()
  logger.info(`[JOB START] autoCloseActivities at ${timestamp}`)

  try {
    // Find all activities still open but past auto-close date
    const overdueActivities = await Activity.findAll({
      where: {
        status: 'open',
        auto_close_at: {
          [Op.lte]: new Date()
        }
      }
    })

    if (overdueActivities.length === 0) {
      logger.info('[JOB END] autoCloseActivities: 0 activities closed.')
      return
    }

    let closedCount = 0

    for (const activity of overdueActivities) {
      activity.status = 'closed'
      await activity.save()
      closedCount++

      // Emit slot_closed event to the trip room via socket
      if (global.io) {
        global.io.to(activity.id).emit('slot_closed', {
          activityId: activity.id,
          status: 'closed',
          message: 'Registration window has automatically closed.'
        })
      }
    }

    logger.info(`[JOB END] autoCloseActivities: ${closedCount} activities successfully auto-closed.`)
  } catch (error) {
    logger.error('[JOB ERROR] autoCloseActivities failed:', error)
    // Sentry trigger placeholder here if integrated, non-blocking
  }
}
