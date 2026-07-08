import { Router } from 'express'
import { authGuard } from '../../middleware/auth.middleware.js'
import * as socialController from './social.controller.js'

const router = Router()

// All social operations require active session validation
router.use(authGuard)

// Follow links
router.post('/follows/:userId', socialController.followUser)
router.delete('/follows/:userId', socialController.unfollowUser)
router.get('/follows/:userId/followers', socialController.getFollowers)
router.get('/follows/:userId/following', socialController.getFollowing)

// Block links
router.post('/blocks/:userId', socialController.blockUser)
router.delete('/blocks/:userId', socialController.unblockUser)

export default router
export { router }
