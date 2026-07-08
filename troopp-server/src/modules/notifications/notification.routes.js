import { Router } from 'express'
import { authGuard } from '../../middleware/auth.middleware.js'
import * as notificationController from './notification.controller.js'

const router = Router()

// All notifications operations require user sessions
router.use(authGuard)

router.get('/', notificationController.getUserNotifications)
router.put('/read-all', notificationController.markAllAsRead)
router.get('/preferences', notificationController.getPreferences)
router.put('/preferences', notificationController.updatePreferences)
router.post('/fcm-token', notificationController.registerFCMToken)

export default router
export { router }
