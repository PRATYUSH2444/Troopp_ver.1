import * as adminService from './admin.service.js'
import AdminLog from '../../models/AdminLog.js'
import IPBlock from '../../models/IPBlock.js'
import Report from '../../models/Report.js'
import ActivityReport from '../../models/ActivityReport.js'
import User from '../../models/User.js'
import Profile from '../../models/Profile.js'
import Activity from '../../models/Activity.js'
import City from '../../models/City.js'

/**
 * REST Controllers wrapping administrative actions.
 */

export const getDashboard = async (req, res, next) => {
  try {
    const data = await adminService.getDashboard()
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export const searchUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const list = await adminService.searchUsers(req.query, page, limit)
    res.status(200).json({
      success: true,
      data: list.rows,
      total: list.count,
      page,
      limit
    })
  } catch (error) {
    next(error)
  }
}

export const getUserDetail = async (req, res, next) => {
  try {
    const data = await adminService.getUserDetail(req.params.userId)
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export const suspendUser = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { days, reason } = req.body
    const user = await adminService.suspendUser(req.user.id, userId, days, reason)
    res.status(200).json({ success: true, message: 'User suspended successfully.', data: user })
  } catch (error) {
    next(error)
  }
}

export const unsuspendUser = async (req, res, next) => {
  try {
    const { userId } = req.params
    const user = await adminService.unsuspendUser(req.user.id, userId)
    res.status(200).json({ success: true, message: 'User suspension lifted.', data: user })
  } catch (error) {
    next(error)
  }
}

export const banUser = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { reason } = req.body
    const user = await adminService.banUser(req.user.id, userId, reason)
    res.status(200).json({ success: true, message: 'User permanently banned.', data: user })
  } catch (error) {
    next(error)
  }
}

export const overrideTrustScore = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { newScore, reason } = req.body
    const user = await adminService.overrideTrustScore(req.user.id, userId, newScore, reason)
    res.status(200).json({ success: true, message: 'Trust score overridden successfully.', data: user })
  } catch (error) {
    next(error)
  }
}

export const getReportsQueue = async (req, res, next) => {
  try {
    const list = await Report.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'Reporter', include: [{ model: Profile, as: 'Profile', attributes: ['name'] }] },
        { model: User, as: 'ReportedUser', include: [{ model: Profile, as: 'Profile', attributes: ['name'] }] }
      ]
    })
    res.status(200).json({ success: true, data: list })
  } catch (error) {
    next(error)
  }
}

export const resolveReport = async (req, res, next) => {
  try {
    const { reportId } = req.params
    const { status, resolutionNote } = req.body
    const report = await adminService.resolveReport(req.user.id, reportId, status, resolutionNote)
    res.status(200).json({ success: true, message: 'Report resolved successfully.', data: report })
  } catch (error) {
    next(error)
  }
}

export const getActivityReportsQueue = async (req, res, next) => {
  try {
    const list = await ActivityReport.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'Reporter', include: [{ model: Profile, as: 'Profile', attributes: ['name'] }] },
        { model: Activity, as: 'Activity' }
      ]
    })
    res.status(200).json({ success: true, data: list })
  } catch (error) {
    next(error)
  }
}

export const resolveActivityReport = async (req, res, next) => {
  try {
    const { reportId } = req.params
    const { status, resolutionNote } = req.body
    const report = await adminService.resolveActivityReport(req.user.id, reportId, status, resolutionNote)
    res.status(200).json({ success: true, message: 'Activity report resolved successfully.', data: report })
  } catch (error) {
    next(error)
  }
}


export const cancelActivity = async (req, res, next) => {
  try {
    const { activityId } = req.params
    const { reason } = req.body
    await adminService.adminCancelActivity(req.user.id, activityId, reason)
    res.status(200).json({ success: true, message: 'Activity cancelled.' })
  } catch (error) {
    next(error)
  }
}

export const sendBroadcast = async (req, res, next) => {
  try {
    const { target, cityId, title, body } = req.body
    await adminService.sendBroadcast(req.user.id, target, cityId, title, body)
    res.status(200).json({ success: true, message: 'Broadcast push notifications sent.' })
  } catch (error) {
    next(error)
  }
}

export const getIPBlocks = async (req, res, next) => {
  try {
    const list = await IPBlock.findAll({ order: [['createdAt', 'DESC']] })
    res.status(200).json({ success: true, data: list })
  } catch (error) {
    next(error)
  }
}

export const addIPBlock = async (req, res, next) => {
  try {
    const { ip, reason, expiresAt } = req.body
    const block = await adminService.addIPBlock(req.user.id, ip, reason, expiresAt)
    res.status(200).json({ success: true, message: 'IP blocked successfully.', data: block })
  } catch (error) {
    next(error)
  }
}

export const removeIPBlock = async (req, res, next) => {
  try {
    const { ipBlockId } = req.params
    await adminService.removeIPBlock(req.user.id, ipBlockId)
    res.status(200).json({ success: true, message: 'IP block removed.' })
  } catch (error) {
    next(error)
  }
}

export const getAdminLogs = async (req, res, next) => {
  try {
    const list = await AdminLog.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'Admin', include: [{ model: Profile, as: 'Profile', attributes: ['name'] }] }
      ]
    })
    res.status(200).json({ success: true, data: list })
  } catch (error) {
    next(error)
  }
}

export const promoteToAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body
    const user = await adminService.promoteToAdmin(req.user.id, userId)
    res.status(200).json({ success: true, message: 'User promoted to administrator.', data: user })
  } catch (error) {
    next(error)
  }
}

export const demoteAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body
    const user = await adminService.demoteAdmin(req.user.id, userId)
    res.status(200).json({ success: true, message: 'Administrator demoted to member.', data: user })
  } catch (error) {
    next(error)
  }
}
