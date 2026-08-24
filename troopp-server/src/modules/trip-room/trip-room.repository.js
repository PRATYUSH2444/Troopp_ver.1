import { Op } from 'sequelize'
import Message from '../../models/Message.js'
import Expense from '../../models/Expense.js'
import ExpenseSplit from '../../models/ExpenseSplit.js'
import Poll from '../../models/Poll.js'
import CheckInPoint from '../../models/CheckInPoint.js'
import CheckInLog from '../../models/CheckInLog.js'
import MemberMute from '../../models/MemberMute.js'
import JoinerOnboardingStatus from '../../models/JoinerOnboardingStatus.js'
import ActivityMember from '../../models/ActivityMember.js'
import Activity from '../../models/Activity.js'
import TripRule from '../../models/TripRule.js'
import User from '../../models/User.js'
import Profile from '../../models/Profile.js'
import EmergencyContact from '../../models/EmergencyContact.js'
import Report from '../../models/Report.js'

/**
 * Handles all database operations for real-time Trip Rooms.
 */

// 1. MESSAGES CRUD
export const getMessagesPaginated = async (roomId, limit = 50, offset = 0) => {
  return await Message.findAndCountAll({
    where: { trip_room_id: roomId },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'ASC']],
    include: [
      {
        model: User,
        as: 'Sender',
        attributes: ['id', 'trust_score'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
      }
    ]
  })
}

export const createMessage = async (data) => {
  return await Message.create(data)
}

export const pinMessage = async (messageId, isPinned) => {
  const msg = await Message.findByPk(messageId)
  if (!msg) return null
  msg.is_pinned = isPinned
  await msg.save()
  return msg
}

export const softDeleteMessage = async (messageId) => {
  const msg = await Message.findByPk(messageId)
  if (!msg) return null
  // Simulate soft delete using message body placeholder or deleted_at timestamp
  msg.message_text = 'Removed by host'
  msg.deleted_at = new Date()
  await msg.save()
  return msg
}

// 2. EXPENSES CRUD
export const getExpensesWithSplits = async (activityId) => {
  return await Expense.findAll({
    where: { activity_id: activityId },
    order: [['created_at', 'DESC']],
    include: [
      {
        model: User,
        as: 'Payer',
        attributes: ['id'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name'] }]
      },
      {
        model: ExpenseSplit,
        as: 'Splits',
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id'],
            include: [{ model: Profile, as: 'Profile', attributes: ['name'] }]
          }
        ]
      }
    ]
  })
}

export const createExpenseWithSplits = async (activityId, payerId, amount, description, splitsList) => {
  const expense = await Expense.create({
    activity_id: activityId,
    payer_id: payerId,
    amount,
    description
  })

  // Create splits
  const splitPromises = splitsList.map((split) =>
    ExpenseSplit.create({
      expense_id: expense.id,
      user_id: split.userId,
      share_amount: split.shareAmount,
      is_settled: split.userId === payerId // Auto-settled for payer
    })
  )
  await Promise.all(splitPromises)

  return await Expense.findByPk(expense.id, {
    include: [{ model: ExpenseSplit, as: 'Splits' }]
  })
}

export const deleteExpense = async (expenseId) => {
  const exp = await Expense.findByPk(expenseId)
  if (!exp) return false
  await ExpenseSplit.destroy({ where: { expense_id: expenseId } })
  await exp.destroy()
  return true
}

export const settleSplit = async (splitId) => {
  const split = await ExpenseSplit.findByPk(splitId)
  if (!split) return null
  split.is_settled = true
  split.settled_at = new Date()
  await split.save()
  return split
}

// 3. POLLS CRUD
export const getPollsByActivity = async (activityId) => {
  return await Poll.findAll({
    where: { activity_id: activityId },
    order: [['created_at', 'DESC']]
  })
}

export const createPoll = async (activityId, creatorId, question, options) => {
  // Initialize votes array matching options length
  const votes = Array(options.length).fill(null).map(() => [])
  return await Poll.create({
    activity_id: activityId,
    creator_id: creatorId,
    question,
    options,
    votes,
    is_closed: false
  })
}

export const closePoll = async (pollId) => {
  const poll = await Poll.findByPk(pollId)
  if (!poll) return null
  poll.is_closed = true
  await poll.save()
  return poll
}

// 4. CHECK-IN POINTS & LOGS
export const getCheckInPoints = async (activityId) => {
  return await CheckInPoint.findAll({
    where: { activity_id: activityId },
    order: [['scheduled_time', 'ASC']]
  })
}

export const createCheckInPoint = async (activityId, label, latitude, longitude, radiusMeters, scheduledTime) => {
  return await CheckInPoint.create({
    activity_id: activityId,
    label,
    latitude,
    longitude,
    radius_meters: radiusMeters,
    scheduled_time: scheduledTime
  })
}

export const getCheckInLogsForPoint = async (pointId) => {
  return await CheckInLog.findAll({
    where: { check_in_point_id: pointId },
    include: [
      {
        model: User,
        as: 'User',
        attributes: ['id'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
      }
    ]
  })
}

// 5. ONBOARDING STATUS
export const getOnboardingStatus = async (activityId, userId) => {
  return await JoinerOnboardingStatus.findOne({
    where: { activity_id: activityId, user_id: userId }
  })
}

export const completeOnboarding = async (activityId, userId) => {
  let status = await JoinerOnboardingStatus.findOne({
    where: { activity_id: activityId, user_id: userId }
  })
  if (!status) {
    status = await JoinerOnboardingStatus.create({
      activity_id: activityId,
      user_id: userId,
      onboarding_completed: true,
      completed_at: new Date()
    })
  } else {
    status.onboarding_completed = true
    status.completed_at = new Date()
    await status.save()
  }
  return status
}

// 6. HEALTH DASHBOARD STATS (Aggregated metrics)
export const getHealthMetrics = async (activityId) => {
  // Members trust aggregates
  const members = await ActivityMember.findAll({
    where: { activity_id: activityId, status: 'confirmed' },
    include: [
      {
        model: User,
        as: 'User',
        attributes: ['id', 'trust_score', 'reliability_score'],
        include: [
          { model: EmergencyContact, as: 'EmergencyContact', attributes: ['id'] },
          { model: Profile, as: 'Profile', attributes: ['gender', 'created_at'] }
        ]
      }
    ]
  })

  const totalMembers = members.length
  if (totalMembers === 0) return {}

  let totalTrust = 0
  let trustedCount = 0
  let newMembersCount = 0
  let femaleCount = 0
  let emergencySetCount = 0

  const now = new Date()
  members.forEach((m) => {
    const u = m.User
    if (!u) return
    totalTrust += u.trust_score
    if (u.trust_score >= 75) trustedCount++
    
    // Member is "new" if registered on Troopp for less than 1 month
    const tenureMonths = (now - new Date(u.created_at || now)) / (1000 * 60 * 60 * 24 * 30)
    if (tenureMonths <= 1) newMembersCount++

    if (u.Profile?.gender === 'female') femaleCount++
    if (u.EmergencyContact) emergencySetCount++
  })

  // Pending Checkins count
  const points = await CheckInPoint.findAll({ where: { activity_id: activityId } })
  const pointIds = points.map((p) => p.id)
  const logsCount = await CheckInLog.count({ where: { check_in_point_id: { [Op.in]: pointIds } } })
  const expectedCheckins = pointIds.length * totalMembers
  const pendingCheckins = Math.max(0, expectedCheckins - logsCount)

  // Reports filed count
  const reportsCount = await Report.count({ where: { activity_id: activityId } })

  return {
    averageTrustScore: Math.round(totalTrust / totalMembers),
    trustedMembersCount: trustedCount,
    newMembersCount,
    pendingCheckins,
    reportsFiledCount: reportsCount,
    womenPercentage: Math.round((femaleCount / totalMembers) * 100),
    emergencyContactsSetCount: emergencySetCount
  }
}
