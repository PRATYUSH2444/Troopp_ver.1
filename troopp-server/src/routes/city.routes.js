import { Router } from 'express'
import { City } from '../models/index.js'
import logger from '../config/logger.js'

const router = Router()

// GET /api/v1/cities - Fetch active cities
router.get('/', async (req, res, next) => {
  try {
    const cities = await City.findActive()
    return res.status(200).json({
      success: true,
      data: cities
    })
  } catch (error) {
    logger.error('Error fetching active cities list:', error)
    next(error)
  }
})

export default router
