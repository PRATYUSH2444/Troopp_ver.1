import * as activitiesService from './activities.service.js'
import TripRule from '../../models/TripRule.js'
import TripRoom from '../../models/TripRoom.js'
import CheckInPoint from '../../models/CheckInPoint.js'
import Activity from '../../models/Activity.js'
import { AppError } from '../../middleware/errorHandler.middleware.js'
import logger from '../../config/logger.js'

// ============================================================================
// 1. BASE ACTIVITY ENDPOINTS
// ============================================================================

export const getAllActivities = async (req, res, next) => {
  try {
    const filters = {
      cityId: req.query.cityId,
      status: req.query.status || 'open',
      type: req.query.type,
      isWomenOnly: req.query.isWomenOnly,
      minBudget: req.query.minBudget,
      maxBudget: req.query.maxBudget,
      difficulty: req.query.difficulty,
      maxGroupSize: req.query.maxGroupSize,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    }

    const pagination = {
      limit: req.query.limit || 20,
      offset: req.query.offset || 0
    }

    const data = await activitiesService.getAllByCity(filters, pagination)
    res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

export const getFollowedActivities = async (req, res, next) => {
  try {
    const pagination = {
      limit: req.query.limit || 20,
      offset: req.query.offset || 0
    }

    const data = await activitiesService.getByFollowing(req.user.id, pagination)
    res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

export const searchActivities = async (req, res, next) => {
  try {
    const query = req.query.q || ''
    const cityId = req.query.cityId
    const pagination = {
      limit: req.query.limit || 20,
      offset: req.query.offset || 0
    }

    const data = await activitiesService.search(query, cityId, pagination)
    res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

export const getActivityById = async (req, res, next) => {
  try {
    const data = await activitiesService.getByIdWithDetails(req.params.id, req.user?.id)
    res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

export const createActivity = async (req, res, next) => {
  try {
    const result = await activitiesService.create(req.user.id, req.body)
    res.status(201).json({
      success: true,
      message: 'Activity published successfully.',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const updateActivity = async (req, res, next) => {
  try {
    const activity = await activitiesService.update(req.params.id, req.body, req.user.id)
    res.status(200).json({
      success: true,
      message: 'Activity updated successfully.',
      data: activity
    })
  } catch (error) {
    next(error)
  }
}

export const cancelActivity = async (req, res, next) => {
  try {
    const activity = await activitiesService.cancel(req.params.id, req.user.id)
    res.status(200).json({
      success: true,
      message: 'Activity cancelled successfully.',
      data: activity
    })
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// 2. ENROLLMENT & REQUEST MANAGEMENTS
// ============================================================================

export const joinActivity = async (req, res, next) => {
  try {
    const intent = req.body.intent || 'request'
    const member = await activitiesService.joinActivity(req.params.id, req.user.id, intent)
    res.status(200).json({
      success: true,
      message: member.status === 'confirmed' ? 'Successfully joined the activity!' : 'Join request sent to the host.',
      data: member
    })
  } catch (error) {
    next(error)
  }
}

export const withdrawActivity = async (req, res, next) => {
  try {
    const reason = req.body.reason || ''
    const { member, isLateWithdrawal } = await activitiesService.withdrawFromActivity(req.params.id, req.user.id, reason)
    res.status(200).json({
      success: true,
      message: 'Successfully withdrawn from activity.',
      isLateWithdrawal,
      data: member
    })
  } catch (error) {
    next(error)
  }
}

export const getJoinRequests = async (req, res, next) => {
  try {
    const requests = await activitiesService.getJoinRequests(req.params.id, req.user.id)
    res.status(200).json({
      success: true,
      data: requests
    })
  } catch (error) {
    next(error)
  }
}

export const approveJoinRequest = async (req, res, next) => {
  try {
    const member = await activitiesService.approveJoin(req.params.id, req.params.requestId, req.user.id)
    res.status(200).json({
      success: true,
      message: 'Join request approved.',
      data: member
    })
  } catch (error) {
    next(error)
  }
}

export const declineJoinRequest = async (req, res, next) => {
  try {
    const member = await activitiesService.declineJoin(req.params.id, req.params.requestId, req.user.id)
    res.status(200).json({
      success: true,
      message: 'Join request declined.',
      data: member
    })
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// 3. POST-PUBLISH HOST SETUP ENDPOINTS
// ============================================================================

export const setupRules = async (req, res, next) => {
  try {
    const activity = await Activity.findByPk(req.params.id)
    if (!activity) {
      throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
    }

    if (activity.creator_id !== req.user.id) {
      throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
    }

    let rules = await TripRule.findOne({ where: { activity_id: req.params.id } })
    if (rules) {
      await rules.update(req.body)
    } else {
      rules = await TripRule.create({
        activity_id: req.params.id,
        ...req.body
      })
    }

    res.status(200).json({
      success: true,
      message: 'Trip rules updated successfully.',
      data: rules
    })
  } catch (error) {
    next(error)
  }
}

export const setupWelcomeMessage = async (req, res, next) => {
  try {
    const activity = await Activity.findByPk(req.params.id)
    if (!activity) {
      throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
    }

    if (activity.creator_id !== req.user.id) {
      throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
    }

    const room = await TripRoom.findOne({ where: { activity_id: req.params.id } })
    if (!room) {
      throw new AppError('Trip room not found.', 404, 'TRIP_ROOM_NOT_FOUND')
    }

    // Save welcome message text dynamically on trip room
    room.welcome_message = req.body.message_text
    await room.save()

    res.status(200).json({
      success: true,
      message: 'Welcome message configured successfully.',
      data: room
    })
  } catch (error) {
    next(error)
  }
}

export const setupWaypoints = async (req, res, next) => {
  try {
    const activity = await Activity.findByPk(req.params.id)
    if (!activity) {
      throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
    }

    if (activity.creator_id !== req.user.id) {
      throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
    }

    // Clear existing check-in points to support updates/overwrites
    await CheckInPoint.destroy({ where: { activity_id: req.params.id } })

    const waypointEntries = req.body.waypoints.map((wp) => ({
      activity_id: req.params.id,
      label: wp.label,
      latitude: wp.latitude,
      longitude: wp.longitude,
      radius_meters: wp.radius_meters || 100,
      scheduled_time: wp.scheduled_time || null
    }))

    const checkInPoints = await CheckInPoint.bulkCreate(waypointEntries)

    res.status(200).json({
      success: true,
      message: 'Trip waypoints configured successfully.',
      data: checkInPoints
    })
  } catch (error) {
    next(error)
  }
}

export const getMemberTrustCard = async (req, res, next) => {
  try {
    const data = await activitiesService.getMemberTrustCard(req.params.userId, req.user.id)
    res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}
