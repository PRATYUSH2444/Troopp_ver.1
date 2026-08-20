import { Router } from 'express'
import * as communityController from '../controllers/community.controller.js'
import { protect, resolveUserOptional } from '../middleware/auth.middleware.js'
import {
  communityVoteLimiter,
  communityPostLimiter,
  communityCommentLimiter,
  communityReportLimiter
} from '../middleware/rateLimit.middleware.js'

const router = Router()

// Public read endpoints (SEO indexable, optional auth for voter status resolved if logged in)
router.get('/search', resolveUserOptional, communityController.searchCommunity)
router.get('/boards', resolveUserOptional, communityController.listBoards)
router.get('/boards/:boardName', resolveUserOptional, communityController.getBoard)
router.get('/posts', resolveUserOptional, communityController.listPosts)
router.get('/posts/:postId', resolveUserOptional, communityController.getPost)
router.get('/posts/:postId/comments', resolveUserOptional, communityController.listComments)

// Authenticated state-changing routes
router.post('/boards', protect, communityController.createBoard)
router.post('/boards/:boardName/subscribe', protect, communityController.subscribeBoard)
router.delete('/boards/:boardName/subscribe', protect, communityController.unsubscribeBoard)
router.get('/boards/:boardName/subscribe/status', protect, communityController.getSubscriptionStatus)

router.post('/posts', protect, communityPostLimiter, communityController.createPost)
router.delete('/posts/:postId', protect, communityController.deletePost)

router.post('/votes', protect, communityVoteLimiter, communityController.castVote)
router.post('/posts/:postId/comments', protect, communityCommentLimiter, communityController.createComment)
router.delete('/comments/:commentId', protect, communityController.deleteComment)

router.post('/saved-items/toggle', protect, communityController.toggleSaveItem)

// Edit Endpoints
router.put('/posts/:postId', protect, communityController.editPost)
router.put('/comments/:commentId', protect, communityController.editComment)

// Reporting & Moderation Queue
router.post('/reports', protect, communityReportLimiter, communityController.reportItem)
router.get('/moderation/queue', protect, communityController.listModerationQueue)
router.post('/moderation/reports/:reportId/action', protect, communityController.resolveModerationAction)

// Poll Voting
router.post('/posts/:postId/poll/vote', protect, communityController.castPollVote)

// Community Board Ban Handling
router.post('/boards/:boardName/ban', protect, communityController.banMember)
router.delete('/boards/:boardName/ban/:userId', protect, communityController.unbanMember)

// Media Direct Upload Pipeline
router.post('/media/presign', protect, communityController.getPresignedUploadUrl)
router.post('/media/complete', protect, communityController.completeUpload)

// Community Notifications & Inbox
router.get('/notifications', protect, communityController.listNotifications)
router.patch('/notifications/:id/read', protect, communityController.markNotificationAsRead)

export default router
