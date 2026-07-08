import { Op } from 'sequelize'
import User from '../models/User.js'
import Profile from '../models/Profile.js'
import * as trustService from '../modules/trust/trust.service.js'
import logger from '../config/logger.js'

/**
 * Job to reward active travelers with +1 Trust point for every month of tenure.
 * Runs on the 1st of every month at midnight (0 0 1 * *).
 */
export const runIncrementTenureScores = async () => {
  const timestamp = new Date().toISOString()
  logger.info(`[JOB START] incrementTenureScores at ${timestamp}`)

  try {
    // Find all active users with score not frozen
    const users = await User.findAll({
      where: {
        account_status: 'active',
        score_frozen: false
      },
      attributes: ['id']
    })

    if (users.length === 0) {
      logger.info('[JOB END] incrementTenureScores: 0 active users to update.')
      return
    }

    let updatedCount = 0

    for (const user of users) {
      try {
        // 1. Award +1 Trust score
        await trustService.addTrustScore(user.id, 1, 'account_tenure')

        // 2. Increment profiles.account_tenure_months += 1
        await Profile.increment('account_tenure_months', {
          by: 1,
          where: {
            user_id: user.id
          }
        })

        updatedCount++
      } catch (err) {
        logger.error(`[JOB ERROR] Failed incrementing tenure for user ${user.id}:`, err)
      }
    }

    logger.info(`[JOB END] incrementTenureScores: Updated ${updatedCount} travelers accounts tenure.`)
  } catch (error) {
    logger.error('[JOB ERROR] incrementTenureScores failed:', error)
  }
}
