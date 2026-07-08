import { Op } from 'sequelize'
import Activity from '../models/Activity.js'
import logger from '../config/logger.js'

/**
 * Job to close the co-traveler rating submission window 48 hours post-trip start.
 * Runs hourly (0 * * * *).
 */
export const runCloseRatingWindows = async () => {
  const timestamp = new Date().toISOString()
  logger.info(`[JOB START] closeRatingWindows at ${timestamp}`)

  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)

    // Find activities completed, starting past 48 hours, whose window is still open
    const activities = await Activity.findAll({
      where: {
        status: 'completed',
        date_time: {
          [Op.lte]: fortyEightHoursAgo
        },
        rating_window_closed: false
      }
    })

    if (activities.length === 0) {
      logger.info('[JOB END] closeRatingWindows: 0 rating windows locked.')
      return
    }

    let closedCount = 0

    for (const activity of activities) {
      activity.rating_window_closed = true
      await activity.save()
      closedCount++
    }

    logger.info(`[JOB END] closeRatingWindows: Locked rating windows for ${closedCount} activities.`)
  } catch (error) {
    logger.error('[JOB ERROR] closeRatingWindows failed:', error)
  }
}
