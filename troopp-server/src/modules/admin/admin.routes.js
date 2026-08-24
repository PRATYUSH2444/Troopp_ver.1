import { Router } from 'express'
import { authGuard, adminOnly } from '../../middleware/auth.middleware.js'
import * as adminController from './admin.controller.js'

const router = Router()

// All routes require session login and admin-only flags
router.use(authGuard)
router.use(adminOnly)

// KPIs and dashboard stats
router.get('/dashboard', adminController.getDashboard)

// Traveler administration
router.get('/users', adminController.searchUsers)
router.get('/users/:userId', adminController.getUserDetail)
router.put('/users/:userId/suspend', adminController.suspendUser)
router.put('/users/:userId/unsuspend', adminController.unsuspendUser)
router.put('/users/:userId/ban', adminController.banUser)
router.put('/users/:userId/override-trust', adminController.overrideTrustScore)

// Report queues
router.get('/reports', adminController.getReportsQueue)
router.put('/reports/:reportId/resolve', adminController.resolveReport)
router.get('/activity-reports', adminController.getActivityReportsQueue)
router.put('/activity-reports/:reportId/resolve', adminController.resolveActivityReport)



// Activity oversight
router.get('/activities', adminController.getActivities)
router.put('/activities/:activityId/cancel', adminController.cancelActivity)

// Mass broadcast pushes
router.get('/broadcasts', adminController.getBroadcasts)
router.post('/broadcast', adminController.sendBroadcast)

// Platform Analytics
router.get('/analytics', adminController.getAnalytics)

// IP Blocks management
router.get('/ip-blocks', adminController.getIPBlocks)
router.post('/ip-blocks', adminController.addIPBlock)
router.delete('/ip-blocks/:ipBlockId', adminController.removeIPBlock)

// Audit logging history logs
router.get('/logs', adminController.getAdminLogs)

// Admins promotions settings
router.get('/admins', adminController.getAdmins)
router.post('/promote', adminController.promoteToAdmin)
router.post('/demote', adminController.demoteAdmin)

export default router
export { router }
