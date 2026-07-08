import { Router } from 'express'
import multer from 'multer'
import { authGuard } from '../../middleware/auth.middleware.js'
import * as memoryWallController from './memory-wall.controller.js'

const router = Router()

// Initialize local Multer memory storage parser
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // Enforce 5MB limit check per file
  }
})

// Secure routes with authentication guard
router.use(authGuard)

router.get('/:activityId', memoryWallController.getMemoryWall)

// Expects array input name 'photos' up to 10 files
router.post('/:activityId/photos', upload.array('photos', 10), memoryWallController.uploadPhotos)

export default router
export { router }
