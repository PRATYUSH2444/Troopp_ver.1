import { Op } from 'sequelize'
import crypto from 'crypto'
import sequelize from '../../config/db.js'
import User from '../../models/User.js'
import Profile from '../../models/Profile.js'
import City from '../../models/City.js'
import Activity from '../../models/Activity.js'
import ActivityMember from '../../models/ActivityMember.js'
import Report from '../../models/Report.js'
import ActivityReport from '../../models/ActivityReport.js'
import AdminLog from '../../models/AdminLog.js'
import IPBlock from '../../models/IPBlock.js'
import TokenBlacklist from '../../models/TokenBlacklist.js'
import TrustScoreLog from '../../models/TrustScoreLog.js'
import ReliabilityScoreLog from '../../models/ReliabilityScoreLog.js'
import { AppError } from '../../middleware/errorHandler.middleware.js'
import * as notificationService from '../notifications/notification.service.js'
import * as trustService from '../trust/trust.service.js'
import logger from '../../config/logger.js'

/**
 * Log administrative action for audit trail.
 */
export const logAdminAction = async (adminId, action, targetId, targetType, details) => {
  try {
    return await AdminLog.create({
      admin_id: adminId,
      action,
      target_id: targetId,
      target_type: targetType,
      details
    })
  } catch (err) {
    logger.error('Failed writing admin audit log:', err)
  }
}

/**
 * Aggregates all system KPI metrics and city breakdowns.
 */
export const getDashboard = async () => {
  const totalUsers = await User.count()
  const activeTrips = await Activity.count({ where: { status: 'active' } })
  
  const pendingReports = (await Report.count({ where: { status: 'pending' } })) +
                         (await ActivityReport.count({ where: { status: 'pending' } }))

  // Today start time
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const newSignupsToday = await User.count({ where: { createdAt: { [Op.gt]: todayStart } } })

  const avgTrustScoreRaw = await User.mean('trust_score')
  const avgTrustScore = avgTrustScoreRaw ? parseFloat(avgTrustScoreRaw.toFixed(1)) : 50

  // City breakdown data
  const cities = await City.findAll()
  const cityBreakdown = []
  for (const c of cities) {
    const userCount = await User.count({ where: { city_id: c.id } })
    const activeCount = await Activity.count({ where: { city_id: c.id, status: 'active' } })
    const completedCount = await Activity.count({ where: { city_id: c.id, status: 'completed' } })

    cityBreakdown.push({
      city: c.name,
      users: userCount,
      activeTrips: activeCount,
      completedTrips: completedCount,
      reportedUsersPct: userCount > 0 ? ((await Report.count({
        include: [{ model: User, as: 'ReportedUser', where: { city_id: c.id } }]
      })) / userCount * 100).toFixed(1) : 0
    })
  }

  return {
    kpis: {
      totalUsers,
      activeTrips,
      pendingReports,
      newSignupsToday,
      avgTrustScore
    },
    cityBreakdown
  }
}

/**
 * Queries users list matching filters.
 */
export const searchUsers = async (filters = {}, page = 1, limit = 50) => {
  const offset = (page - 1) * limit
  const where = {}

  if (filters.city_id) where.city_id = filters.city_id
  if (filters.account_status) where.account_status = filters.account_status

  if (filters.search) {
    where[Op.or] = [
      { email: { [Op.like]: `%${filters.search}%` } },
      { phone: { [Op.like]: `%${filters.search}%` } }
    ]
  }

  return await User.findAndCountAll({
    where,
    limit,
    offset,
    include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender'] }],
    order: [['createdAt', 'DESC']]
  })
}

/**
 * Fetches user profile, trust score trails, trips, and reports.
 */
export const getUserDetail = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Profile, as: 'Profile' }]
  })
  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND')
  }

  const trustLogs = await TrustScoreLog.findAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
    limit: 10
  })

  const trips = await ActivityMember.findAll({
    where: { user_id: userId },
    include: [{ model: Activity, as: 'Activity' }],
    order: [['createdAt', 'DESC']]
  })

  const reportsFiled = await Report.findAll({
    where: { reporter_id: userId },
    include: [
      {
        model: User,
        as: 'ReportedUser',
        include: [{ model: Profile, as: 'Profile', attributes: ['name'] }]
      }
    ]
  })

  const reportsReceived = await Report.findAll({
    where: { reported_user_id: userId },
    include: [
      {
        model: User,
        as: 'Reporter',
        include: [{ model: Profile, as: 'Profile', attributes: ['name'] }]
      }
    ]
  })

  return {
    user,
    trustLogs,
    trips,
    reportsFiled,
    reportsReceived
  }
}

/**
 * Temporarily suspends user account. Forces token logout.
 */
export const suspendUser = async (adminId, userId, days, reason) => {
  const user = await User.findByPk(userId)
  if (!user) throw new AppError('User not found.', 404)

  const suspensionExpiry = new Date()
  suspensionExpiry.setDate(suspensionExpiry.getDate() + parseInt(days))

  user.account_status = 'suspended'
  user.suspension_until = suspensionExpiry
  user.ban_reason = reason
  await user.save()

  // Invalidate user sessions - mock force logout by clearing tokens
  await TokenBlacklist.create({
    token_hash: crypto.createHash('sha256').update(`force-logout-${userId}`).digest('hex'),
    expires_at: suspensionExpiry,
    user_id: userId
  })

  // FCM alert push
  await notificationService.createNotificationRecord(
    userId,
    'system_update',
    '⚠️ Account Suspended',
    `Your account has been suspended for ${days} days until ${suspensionExpiry.toLocaleDateString()}. Reason: ${reason}`
  )
  await notificationService.sendFCM(userId, '⚠️ Account Suspended', 'Your account has been suspended.', {
    type: 'system_update'
  })

  await logAdminAction(adminId, 'suspend_user', userId, 'user', `Suspended for ${days} days. Reason: ${reason}`)
  return user
}

/**
 * Activates suspended user account.
 */
export const unsuspendUser = async (adminId, userId) => {
  const user = await User.findByPk(userId)
  if (!user) throw new AppError('User not found.', 404)

  user.account_status = 'active'
  user.suspension_until = null
  user.ban_reason = null
  await user.save()

  await notificationService.createNotificationRecord(
    userId,
    'system_update',
    '✅ Account Restored',
    'Your account suspension has been lifted by the administrator.'
  )
  await notificationService.sendFCM(userId, '✅ Account Restored', 'Your account has been reactivated.', {
    type: 'system_update'
  })

  await logAdminAction(adminId, 'unsuspend_user', userId, 'user', 'Suspension lifted.')
  return user
}

/**
 * Permanently bans user.
 */
export const banUser = async (adminId, userId, reason) => {
  const user = await User.findByPk(userId)
  if (!user) throw new AppError('User not found.', 404)

  user.account_status = 'banned'
  user.score_frozen = true
  user.ban_reason = reason
  await user.save()

  // FCM push
  await notificationService.sendFCM(userId, '🚫 Permanent Account Ban', 'Your account has been permanently banned.', {
    type: 'system_update'
  })

  await logAdminAction(adminId, 'ban_user', userId, 'user', `Permanent Ban. Reason: ${reason}`)
  return user
}

/**
 * Manual override of user trust score.
 */
export const overrideTrustScore = async (adminId, userId, newScore, reason) => {
  const user = await User.findByPk(userId)
  if (!user) throw new AppError('User not found.', 404)

  const oldScore = user.trust_score
  user.trust_score = Math.max(0, Math.min(100, parseInt(newScore)))
  await user.save()

  // Log in trust score history
  await TrustScoreLog.create({
    user_id: userId,
    old_score: oldScore,
    new_score: user.trust_score,
    delta: user.trust_score - oldScore,
    reason: 'admin_override',
    details: reason
  })

  await logAdminAction(adminId, 'override_trust_score', userId, 'user', `Changed from ${oldScore} to ${newScore}. Reason: ${reason}`)
  return user
}

/**
 * Evaluates reports and runs the 3-strike policy.
 */
export const resolveReport = async (adminId, reportId, status, resolutionNote) => {
  const report = await Report.findByPk(reportId)
  if (!report) throw new AppError('Report not found.', 404)

  report.status = status === 'resolved' ? 'resolved' : 'dismissed'
  await report.save()

  if (status === 'resolved') {
    const reportedUserId = report.reported_user_id
    
    // Count valid reports against the user to evaluate strikes
    const validCount = await Report.count({
      where: { reported_user_id: reportedUserId, status: 'resolved' }
    })

    if (validCount === 1) {
      // Strike 1: Warning + Deduct trust score 20
      await trustService.addTrustScore(reportedUserId, -20, 'strike_1_penalty')
      await notificationService.createNotificationRecord(
        reportedUserId,
        'emergency_alert',
        '⚠️ Warning Strike 1',
        'You have received a strike warning for violating community guidelines. 20 Trust score points deducted.'
      )
      await notificationService.sendFCM(reportedUserId, '⚠️ Warning Strike 1', 'Guidelines violation strike warning.', { type: 'emergency_alert' })
    } 
    else if (validCount === 2) {
      // Strike 2: Suspend 30 days
      await suspendUser(adminId, reportedUserId, 30, 'Strike 2 guideline violation penalty')
    } 
    else if (validCount >= 3) {
      // Strike 3: Permanent Ban
      await banUser(adminId, reportedUserId, 'Strike 3 guideline violation penalty')
    }
  }

  await logAdminAction(adminId, 'resolve_report', reportId, 'report', `Marked: ${status}. Resolution Note: ${resolutionNote}`)
  return report
}

/**
 * Evaluates activity reports (inappropriate trip descriptions).
 */
export const resolveActivityReport = async (adminId, reportId, status, resolutionNote) => {
  const report = await ActivityReport.findByPk(reportId)
  if (!report) throw new AppError('Activity report not found.', 404)

  report.status = status === 'resolved' ? 'resolved' : 'dismissed'
  await report.save()

  if (status === 'resolved') {
    // Invalidate activity content
    await adminCancelActivity(adminId, report.activity_id, 'Activity flagged for inappropriate guidelines content.')
  }

  await logAdminAction(adminId, 'resolve_activity_report', reportId, 'activity_report', `Marked: ${status}. Resolution Note: ${resolutionNote}`)
  return report
}


/**
 * Administrative soft cancellation of trip activities.
 */
export const adminCancelActivity = async (adminId, activityId, reason) => {
  const activity = await Activity.findByPk(activityId)
  if (!activity) throw new AppError('Activity not found.', 404)

  activity.status = 'cancelled'
  await activity.save()

  // Notify members
  const members = await ActivityMember.findAll({
    where: { activity_id: activityId, status: 'confirmed' }
  })
  
  const memberUserIds = members.map((m) => m.user_id)
  if (memberUserIds.length > 0) {
    const title = '🚫 Trip Cancelled by Admin'
    const body = `Trip: ${activity.title} was cancelled by administrator. Reason: ${reason}`
    
    for (const memberId of memberUserIds) {
      await notificationService.createNotificationRecord(memberId, 'activity_cancelled', title, body, 'activity', activityId)
    }
    await notificationService.sendFCM(memberUserIds, title, body, {
      type: 'activity_cancelled',
      referenceType: 'activity',
      referenceId: activityId
    })
  }

  await logAdminAction(adminId, 'cancel_activity', activityId, 'activity', `Cancelled by administrator. Reason: ${reason}`)
}

/**
 * Multicast broadcasts delivery in batches of 500.
 */
export const sendBroadcast = async (adminId, target, cityId, title, body) => {
  let userQuery = {}
  if (target === 'city' && cityId) {
    userQuery.city_id = cityId
  }

  const users = await User.findAll({ where: userQuery, attributes: ['id'] })
  const userIds = users.map((u) => u.id)

  if (userIds.length > 0) {
    // Deliver messages in batches of 500 (multicast sending limits)
    const batchSize = 500
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batchIds = userIds.slice(i, i + batchSize)
      for (const uid of batchIds) {
        await notificationService.createNotificationRecord(uid, 'admin_broadcast', title, body)
      }
      await notificationService.sendFCM(batchIds, title, body, { type: 'admin_broadcast' })
    }
  }

  await logAdminAction(adminId, 'send_broadcast', null, null, `Target: ${target}. Title: ${title}`)
}

/**
 * Invalidate IP addresses.
 */
export const addIPBlock = async (adminId, ip, reason, expiresAt) => {
  const [block] = await IPBlock.findOrCreate({
    where: { ip_address: ip },
    defaults: {
      ip_address: ip,
      reason,
      blocked_by: adminId,
      expires_at: expiresAt ? new Date(expiresAt) : null
    }
  })

  await logAdminAction(adminId, 'add_ip_block', block.id, 'ip_block', `IP: ${ip}. Reason: ${reason}`)
  return block
}

/**
 * Remove IP block.
 */
export const removeIPBlock = async (adminId, ipBlockId) => {
  const block = await IPBlock.findByPk(ipBlockId)
  if (!block) throw new AppError('IP block not found.', 404)

  await block.destroy()
  await logAdminAction(adminId, 'remove_ip_block', ipBlockId, 'ip_block', `IP: ${block.ip_address} unblocked.`)
}

/**
 * Promote normal traveler role to administrator.
 */
export const promoteToAdmin = async (adminId, userId) => {
  const user = await User.findByPk(userId)
  if (!user) throw new AppError('User not found.', 404)

  if (user.role === 'admin') {
    throw new AppError('User is already an administrator.', 400, 'ALREADY_ADMIN')
  }

  user.role = 'admin'
  await user.save()

  await logAdminAction(adminId, 'promote_admin', userId, 'user', 'Promoted to admin.')
  return user
}

/**
 * Demote administrator back to member. Safeguards system admins limits.
 */
export const demoteAdmin = async (adminId, userId) => {
  if (adminId === userId) {
    throw new AppError('Access denied: You cannot demote yourself.', 403, 'SELF_DEMOTION')
  }

  const user = await User.findByPk(userId)
  if (!user) throw new AppError('User not found.', 404)

  // Verify that at least 1 other administrator remains
  const adminCount = await User.count({ where: { role: 'admin' } })
  if (adminCount <= 1) {
    throw new AppError('Action denied: The system must contain at least one administrator.', 400, 'NO_ADMINS')
  }

  user.role = 'member'
  await user.save()

  await logAdminAction(adminId, 'demote_admin', userId, 'user', 'Demoted to member.')
  return user
}
