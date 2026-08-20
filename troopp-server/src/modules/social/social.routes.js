import { Router } from 'express'
import { authGuard } from '../../middleware/auth.middleware.js'
import * as socialController from './social.controller.js'

const router = Router()

// Follow links
router.post('/follows/:userId', authGuard, socialController.followUser)
router.delete('/follows/:userId', authGuard, socialController.unfollowUser)
router.get('/follows/:userId/followers', authGuard, socialController.getFollowers)
router.get('/follows/:userId/following', authGuard, socialController.getFollowing)

// Block links
router.post('/blocks/:userId', authGuard, socialController.blockUser)
router.delete('/blocks/:userId', authGuard, socialController.unblockUser)

export default router
export { router }

