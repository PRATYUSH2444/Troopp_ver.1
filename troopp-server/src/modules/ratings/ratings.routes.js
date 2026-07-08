import { Router } from 'express'
import { authGuard } from '../../middleware/auth.middleware.js'
import * as ratingsController from './ratings.controller.js'

const router = Router()

// All routes require user session verification
router.use(authGuard)

router.get('/:activityId/members', ratingsController.getRateableMembers)
router.post('/:activityId', ratingsController.submitRatings)

export default router
export { router }
