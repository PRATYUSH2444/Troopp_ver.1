import { Router } from 'express'
import { authGuard } from '../../middleware/auth.middleware.js'
import * as tripRoomController from './trip-room.controller.js'
import Activity from '../../models/Activity.js'
import ActivityMember from '../../models/ActivityMember.js'
import { AppError } from '../../middleware/errorHandler.middleware.js'
import { uploadChatFile } from '../../middleware/upload.middleware.js'

const router = Router()

// All routes require authentication
router.use(authGuard)

// Middleware: Verify user is a confirmed member or host of this trip room
const checkTripRoomMember = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const activity = await Activity.findByPk(id)
    if (!activity) {
      return next(new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND'))
    }

    if (activity.creator_id === userId || activity.host_id === userId) {
      const [hostMember] = await ActivityMember.findOrCreate({
        where: { activity_id: id, user_id: userId },
        defaults: { status: 'confirmed', role: 'host', position: 0 }
      })
      req.member = hostMember
      req.activity = activity
      return next()
    }

    const member = await ActivityMember.findOne({
      where: { activity_id: id, user_id: userId, status: 'confirmed' }
    })

    if (!member) {
      return next(new AppError('Access denied: You are not a confirmed member of this trip room.', 403, 'TRIP_ROOM_ACCESS_DENIED'))
    }

    req.member = member
    req.activity = activity
    next()
  } catch (err) {
    next(err)
  }
}

// Middleware: Verify user is the creator (host) of this activity
const checkTripHost = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const activity = await Activity.findByPk(id)
    if (!activity) {
      return next(new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND'))
    }

    if (activity.creator_id !== userId) {
      return next(new AppError('Access denied: Host privileges required.', 403, 'TRIP_HOST_ACCESS_DENIED'))
    }

    req.activity = activity
    next()
  } catch (err) {
    next(err)
  }
}

// Onboarding checks
router.get('/:id/onboarding', checkTripRoomMember, tripRoomController.getOnboarding)
router.post('/:id/onboarding-complete', checkTripRoomMember, tripRoomController.completeOnboarding)

// Message endpoints & extensions
router.get('/:id/messages', checkTripRoomMember, tripRoomController.getMessages)
router.get('/:id/messages/search', checkTripRoomMember, tripRoomController.searchMessages)
router.get('/:id/media', checkTripRoomMember, tripRoomController.getMediaGallery)
router.get('/:id/starred', checkTripRoomMember, tripRoomController.getStarredMessages)
router.post('/:id/messages/upload', checkTripRoomMember, uploadChatFile('file'), tripRoomController.uploadChatMedia)
router.post('/:id/messages/:msgId/forward', checkTripRoomMember, tripRoomController.forwardMessage)
router.post('/:id/messages/:messageId/pin', checkTripRoomMember, tripRoomController.pinMessage)
router.delete('/:id/messages/:messageId', checkTripRoomMember, tripRoomController.deleteMessage)

// Room settings & notification preferences
router.patch('/:id/settings', checkTripHost, tripRoomController.updateRoomSettings)
router.patch('/:id/notification-mute', checkTripRoomMember, tripRoomController.muteRoomNotifications)

// Expense management
router.get('/:id/expenses', checkTripRoomMember, tripRoomController.getExpenses)
router.post('/:id/expenses', checkTripRoomMember, tripRoomController.createExpense)
router.delete('/:id/expenses/:expenseId', checkTripRoomMember, tripRoomController.deleteExpense)
router.post('/:id/expenses/splits/:splitId/settle', checkTripRoomMember, tripRoomController.settleSplit)

// Group Polls
router.get('/:id/polls', checkTripRoomMember, tripRoomController.getPolls)
router.post('/:id/polls', checkTripRoomMember, tripRoomController.createPoll)
router.post('/:id/polls/:pollId/close', checkTripRoomMember, tripRoomController.closePoll)

// Group Dashboard statistics
router.get('/:id/health', checkTripRoomMember, tripRoomController.getHealthMetrics)

// Host controls (Host only)
router.post('/:id/mute/:userId', checkTripHost, tripRoomController.muteMember)
router.post('/:id/remove/:userId', checkTripHost, tripRoomController.removeMember)
router.post('/:id/chat-toggle', checkTripHost, tripRoomController.toggleChat)
router.post('/:id/start', checkTripHost, tripRoomController.markTripStarted)
router.post('/:id/end', checkTripHost, tripRoomController.markTripEnded)
router.post('/:id/lock', checkTripHost, tripRoomController.lockUnlockTrip)

export default router
export { router }
