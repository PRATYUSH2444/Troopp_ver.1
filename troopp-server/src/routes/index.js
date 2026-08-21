import { Router } from 'express'
import authRouter from './auth.routes.js'
import cityRouter from './city.routes.js'
import activitiesRouter from '../modules/activities/activities.routes.js'
import tripRoomRouter from '../modules/trip-room/trip-room.routes.js'
import ratingsRouter from '../modules/ratings/ratings.routes.js'
import memoryWallRouter from '../modules/memory-wall/memory-wall.routes.js'
import socialRouter from '../modules/social/social.routes.js'
import notificationRouter from '../modules/notifications/notification.routes.js'
import profileRouter from './profile.routes.js'
import communityRouter from './community.routes.js'

import { User, Activity, City, Profile } from '../models/index.js'

const router = Router()

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Troopp server API is online and fully functional.',
    timestamp: new Date()
  })
})

// Public Landing Home API
router.get('/public/home', async (req, res, next) => {
  try {
    let totalUsers = 0
    let totalActivities = 0
    let totalCities = 0

    try {
      totalUsers = await User.count()
    } catch (e) {
      logger.warn('User count query failed:', e.message)
    }

    try {
      totalActivities = await Activity.count()
    } catch (e) {
      logger.warn('Activity count query failed:', e.message)
    }

    try {
      totalCities = await City.count()
    } catch (e) {
      logger.warn('City count query failed:', e.message)
    }

    let featuredActivities = []
    try {
      featuredActivities = await Activity.findAll({
        where: { status: 'open' },
        limit: 3,
        order: [['created_at', 'DESC']]
      })
    } catch (e) {
      logger.warn('Featured activities query failed:', e.message)
    }

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsers || 0,
          totalActivities: totalActivities || 0,
          totalCities: totalCities || 0
        },
        featuredActivities: featuredActivities || []
      }
    })
  } catch (error) {
    return res.status(200).json({
      success: true,
      data: {
        stats: { totalUsers: 0, totalActivities: 0, totalCities: 0 },
        featuredActivities: []
      }
    })
  }
})

// Authentication & Identity Routes
router.use('/auth', authRouter)

// Cities listing route
router.use('/cities', cityRouter)

// Profiles Routes
router.use('/profiles', profileRouter)

// Activities & Feed Routes
router.use('/activities', activitiesRouter)

// Trip Room Channels Routes
router.use('/trip-rooms', tripRoomRouter)

// Post-Trip Ratings Routes
router.use('/ratings', ratingsRouter)

// Memory Walls photo sharing Routes
router.use('/memory-walls', memoryWallRouter)

// Notifications Routes
router.use('/notifications', notificationRouter)

// Social follower & block layer routes
router.use('/', socialRouter)

// Community Boards routes
router.use('/community', communityRouter)

// Admin Management overrides routes
import adminRouter from '../modules/admin/admin.routes.js'
router.use('/admin', adminRouter)

export default router
