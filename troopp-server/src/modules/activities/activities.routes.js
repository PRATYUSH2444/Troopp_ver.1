import { Router } from 'express'
import * as activityController from './activities.controller.js'
import { protect } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validate.js'
import * as schemas from './activities.validator.js'
import Activity from '../../models/Activity.js'
import { AppError } from '../../middleware/errorHandler.middleware.js'

const router = Router()

// All activity routes are protected and require active session tokens
router.use(protect)

// Middleware to verify the requesting user is the host/creator of the activity
const checkActivityCreator = async (req, res, next) => {
  try {
    const { id } = req.params
    const activity = await Activity.findByPk(id)
    
    if (!activity) {
      return next(new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND'))
    }
    
    if (activity.creator_id !== req.user.id) {
      return next(new AppError('Access denied: You must be the host of this activity.', 403, 'ACTIVITY_HOST_REQUIRED'))
    }
    
    req.activity = activity
    next()
  } catch (err) {
    next(err)
  }
}

// 1. BASE CRUD & FEED ENDPOINTS
router.get('/', activityController.getAllActivities)
router.get('/following', activityController.getFollowedActivities)
router.get('/search', activityController.searchActivities)
router.get('/users/:userId/trust-card', activityController.getMemberTrustCard)
router.get('/:id', activityController.getActivityById)

router.post('/', validate(schemas.createActivitySchema), activityController.createActivity)
router.put('/:id', checkActivityCreator, validate(schemas.updateActivitySchema), activityController.updateActivity)
router.delete('/:id', checkActivityCreator, activityController.cancelActivity)

// 2. ENROLLMENT & REQUEST HOOKS
router.post('/:id/join', validate(schemas.joinActivitySchema), activityController.joinActivity)
router.post('/:id/withdraw', activityController.withdrawActivity)

router.get('/:id/requests', checkActivityCreator, activityController.getJoinRequests)
router.post('/:id/requests/:requestId/approve', checkActivityCreator, activityController.approveJoinRequest)
router.post('/:id/requests/:requestId/decline', checkActivityCreator, activityController.declineJoinRequest)

// 3. POST-PUBLISH SETUP FLOWS
router.post('/:id/setup/rules', checkActivityCreator, validate(schemas.setupRulesSchema), activityController.setupRules)
router.post('/:id/setup/welcome-message', checkActivityCreator, validate(schemas.welcomeMessageSchema), activityController.setupWelcomeMessage)
router.post('/:id/setup/waypoints', checkActivityCreator, validate(schemas.waypointsSchema), activityController.setupWaypoints)

export default router
export { router }
