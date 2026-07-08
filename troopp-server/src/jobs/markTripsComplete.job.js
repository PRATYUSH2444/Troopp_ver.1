import { Op } from 'sequelize'
import sequelize from '../config/db.js'
import Activity from '../models/Activity.js'
import ActivityMember from '../models/ActivityMember.js'
import Profile from '../models/Profile.js'
import MemoryWall from '../models/MemoryWall.js'
import logger from '../config/logger.js'

/**
 * Job to mark closed activities as completed 2 hours after they start.
 * Runs every 15 minutes.
 */
export const runMarkTripsComplete = async () => {
  const timestamp = new Date().toISOString()
  logger.info(`[JOB START] markTripsComplete at ${timestamp}`)

  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

    // Find activities where status='closed' AND date_time <= twoHoursAgo
    const activities = await Activity.findAll({
      where: {
        status: 'closed',
        date_time: {
          [Op.lte]: twoHoursAgo
        }
      }
    })

    if (activities.length === 0) {
      logger.info('[JOB END] markTripsComplete: 0 trips marked complete.')
      return
    }

    let completedCount = 0

    for (const activity of activities) {
      const transaction = await sequelize.transaction()
      try {
        // 1. Update status to completed
        activity.status = 'completed'
        await activity.save({ transaction })

        // 2. Insert MemoryWall record
        await MemoryWall.findOrCreate({
          where: { activity_id: activity.id },
          defaults: { activity_id: activity.id },
          transaction
        })

        // 3. Increment profiles.trips_completed += 1 for all confirmed members
        const members = await ActivityMember.findAll({
          where: {
            activity_id: activity.id,
            status: 'confirmed'
          },
          transaction
        })

        const memberUserIds = members.map((m) => m.user_id)
        if (memberUserIds.length > 0) {
          await Profile.increment('trips_completed', {
            by: 1,
            where: {
              user_id: {
                [Op.in]: memberUserIds
              }
            },
            transaction
          })
        }

        await transaction.commit()
        completedCount++
      } catch (err) {
        await transaction.rollback()
        logger.error(`[JOB ERROR] Failed completing activity ${activity.id}:`, err)
      }
    }

    logger.info(`[JOB END] markTripsComplete: ${completedCount} trips marked as completed.`)
  } catch (error) {
    logger.error('[JOB ERROR] markTripsComplete failed:', error)
  }
}
