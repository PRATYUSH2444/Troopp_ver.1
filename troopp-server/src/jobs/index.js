import cron from 'node-cron'
import { Op } from 'sequelize'
import User from '../models/User.js'
import cloudinary from '../config/cloudinary.js'
import logger from '../config/logger.js'

// Import core cron job handlers
import { runAutoCloseActivities } from './autoCloseActivities.job.js'
import { runMarkTripsComplete } from './markTripsComplete.job.js'
import { runSendRatingPrompts } from './sendRatingPrompts.job.js'
import { runDetectNoShows } from './detectNoShows.job.js'
import { runCloseRatingWindows } from './closeRatingWindows.job.js'
import { runIncrementTenureScores } from './incrementTenureScores.job.js'

/**
 * Register all background cron jobs for Troopp.
 */
export const initCronJobs = () => {
  logger.info('Initializing background cron jobs...')

  // 1. Auto-close Overdue Activities: Runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      await runAutoCloseActivities()
    } catch (err) {
      logger.error('Unhandled error in autoCloseActivities cron:', err)
    }
  })

  // 2. Mark Closed Trips as Completed: Runs every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await runMarkTripsComplete()
    } catch (err) {
      logger.error('Unhandled error in markTripsComplete cron:', err)
    }
  })

  // 3. Trip Rating Prompter: Runs every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await runSendRatingPrompts()
    } catch (err) {
      logger.error('Unhandled error in sendRatingPrompts cron:', err)
    }
  })

  // 4. Detect Missed Check-ins and No-Shows: Runs every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await runDetectNoShows()
    } catch (err) {
      logger.error('Unhandled error in detectNoShows cron:', err)
    }
  })

  // 5. Close Rating Windows (48h Limit): Runs hourly
  cron.schedule('0 * * * *', async () => {
    try {
      await runCloseRatingWindows()
    } catch (err) {
      logger.error('Unhandled error in closeRatingWindows cron:', err)
    }
  })

  // 6. Account Tenure Booster: Runs on 1st day of every month at midnight
  cron.schedule('0 0 1 * *', async () => {
    try {
      await runIncrementTenureScores()
    } catch (err) {
      logger.error('Unhandled error in incrementTenureScores cron:', err)
    }
  })

  // 7. Cloudinary ID Document Deletion Job: Runs daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running cron job: Deleting old verified ID documents...')
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const usersToClean = await User.findAll({
        where: {
          is_id_verified: true,
          id_document_url: {
            [Op.ne]: null
          },
          updated_at: {
            [Op.lt]: thirtyDaysAgo
          }
        }
      })

      logger.info(`Found ${usersToClean.length} verified ID documents older than 30 days to clean.`)

      for (const user of usersToClean) {
        const url = user.id_document_url
        const match = url.match(/\/v\d+\/([^\s]+)\.[a-z0-9]+$/i)
        const publicId = match ? match[1] : null

        if (publicId && !publicId.startsWith('mock')) {
          try {
            await cloudinary.uploader.destroy(publicId)
            logger.info(`Deleted private Cloudinary document: ${publicId} for user ID: ${user.id}`)
          } catch (cloudErr) {
            logger.error(`Failed to destroy Cloudinary file: ${publicId}`, cloudErr)
          }
        }

        user.id_document_url = null
        await user.save()
      }
    } catch (error) {
      logger.error('Error running ID Document Deletion cron job:', error)
    }
  })

  logger.info('Background cron jobs registration complete.')
}

export default initCronJobs
