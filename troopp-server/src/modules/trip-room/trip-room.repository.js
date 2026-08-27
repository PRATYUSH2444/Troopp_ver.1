import { Op, Sequelize } from 'sequelize'
import {
  Message,
  Expense,
  ExpenseSplit,
  ExpensePayer,
  Settlement,
  Poll,
  CheckInPoint,
  CheckInLog,
  MemberMute,
  JoinerOnboardingStatus,
  ActivityMember,
  Activity,
  TripRule,
  TripRoom,
  User,
  Profile,
  EmergencyContact,
  Report,
  MessageDelivery,
  MessageRead,
  MessageReaction,
  MessageStar,
  MessageDeletedUser
} from '../../models/index.js'

/**
 * Handles all database operations for real-time Trip Rooms with full WhatsApp parity.
 */

// Helper: Resolve TripRoom record by activity_id or trip_room_id
export const resolveTripRoom = async (roomId) => {
  let tripRoom = await TripRoom.findOne({ where: { activity_id: roomId } })
  if (!tripRoom) {
    tripRoom = await TripRoom.findByPk(roomId)
  }
  if (!tripRoom) {
    tripRoom = await TripRoom.create({
      activity_id: roomId,
      room_name: 'Trip Room Chat',
      status: 'active',
      chat_enabled: true
    })
  }
  return tripRoom
}

// 1. MESSAGES CRUD & CURSOR PAGINATION
export const getMessagesPaginated = async (roomId, options = {}) => {
  const {
    limit = 50,
    before = null,
    after = null,
    offset = 0,
    requestingUserId = null
  } = options

  // 1. Filter out messages deleted "for me"
  let excludedIds = []
  if (requestingUserId) {
    const deletedForMe = await MessageDeletedUser.findAll({
      where: { user_id: requestingUserId },
      attributes: ['message_id']
    })
    excludedIds = deletedForMe.map((d) => d.message_id)
  }

  // 2. Resolve actual TripRoom ID
  const tripRoom = await resolveTripRoom(roomId)
  const roomIds = tripRoom ? [tripRoom.id, roomId] : [roomId]

  // 3. Build where clause
  const whereClause = {
    trip_room_id: { [Op.in]: roomIds }
  }

  if (excludedIds.length > 0) {
    whereClause.id = { [Op.notIn]: excludedIds }
  }

  // Cursor pagination
  if (before) {
    // Older messages (scrolling up)
    whereClause.created_at = { [Op.lt]: new Date(before) }
  } else if (after) {
    // Newer messages (delta sync on reconnect)
    whereClause.created_at = { [Op.gt]: new Date(after) }
  }

  const { rows, count } = await Message.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit, 10),
    ...(offset && !before && !after ? { offset: parseInt(offset, 10) } : {}),
    order: [['created_at', 'DESC']],
    include: [
      {
        model: User,
        as: 'Sender',
        attributes: ['id', 'trust_score', 'reliability_score'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
      },
      {
        model: Message,
        as: 'ReplyTo',
        attributes: ['id', 'sender_id', 'message_text', 'message_type', 'media'],
        include: [
          {
            model: User,
            as: 'Sender',
            attributes: ['id'],
            include: [{ model: Profile, as: 'Profile', attributes: ['name'] }]
          }
        ]
      },
      {
        model: MessageReaction,
        as: 'Reactions',
        attributes: ['id', 'emoji', 'user_id'],
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id'],
            include: [{ model: Profile, as: 'Profile', attributes: ['name'] }]
          }
        ]
      },
      {
        model: MessageDelivery,
        as: 'Deliveries',
        attributes: ['user_id', 'delivered_at']
      },
      {
        model: MessageRead,
        as: 'Reads',
        attributes: ['user_id', 'read_at']
      },
      ...(requestingUserId
        ? [
            {
              model: MessageStar,
              as: 'Stars',
              where: { user_id: requestingUserId },
              required: false,
              attributes: ['id']
            }
          ]
        : [])
    ]
  })

  // Reverse DESC slice so returned messages are strictly ascending (oldest -> newest) for chat UI
  const chronologicalRows = [...rows].reverse()
  const formattedRows = chronologicalRows.map((m) => {
    const plain = m.toJSON()
    plain.is_starred = Boolean(plain.Stars && plain.Stars.length > 0)
    return plain
  })

  return {
    rows: formattedRows,
    count,
    hasMore: rows.length >= parseInt(limit, 10)
  }
}

// 2. IN-CHAT MESSAGE SEARCH
export const searchMessages = async (roomId, query, requestingUserId = null) => {
  if (!query?.trim()) return []

  let excludedIds = []
  if (requestingUserId) {
    const deletedForMe = await MessageDeletedUser.findAll({
      where: { user_id: requestingUserId },
      attributes: ['message_id']
    })
    excludedIds = deletedForMe.map((d) => d.message_id)
  }

  const tripRoom = await resolveTripRoom(roomId)
  const roomIds = tripRoom ? [tripRoom.id, roomId] : [roomId]

  const whereClause = {
    trip_room_id: { [Op.in]: roomIds },
    deleted_for: { [Op.ne]: 'everyone' },
    message_text: { [Op.iLike]: `%${query.trim()}%` }
  }

  if (excludedIds.length > 0) {
    whereClause.id = { [Op.notIn]: excludedIds }
  }

  const results = await Message.findAll({
    where: whereClause,
    order: [['created_at', 'DESC']],
    limit: 50,
    include: [
      {
        model: User,
        as: 'Sender',
        attributes: ['id'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
      }
    ]
  })

  return results.map((m) => m.toJSON())
}

// 3. MEDIA GALLERY (Photos, Videos, Audio/Voice, Documents, Links)
export const getMediaGallery = async (roomId, mediaType = 'all', requestingUserId = null) => {
  let excludedIds = []
  if (requestingUserId) {
    const deletedForMe = await MessageDeletedUser.findAll({
      where: { user_id: requestingUserId },
      attributes: ['message_id']
    })
    excludedIds = deletedForMe.map((d) => d.message_id)
  }

  const tripRoom = await resolveTripRoom(roomId)
  const roomIds = tripRoom ? [tripRoom.id, roomId] : [roomId]

  const whereClause = {
    trip_room_id: { [Op.in]: roomIds },
    deleted_for: { [Op.ne]: 'everyone' }
  }

  if (excludedIds.length > 0) {
    whereClause.id = { [Op.notIn]: excludedIds }
  }

  if (mediaType === 'image') {
    whereClause.message_type = 'image'
  } else if (mediaType === 'video') {
    whereClause.message_type = 'video'
  } else if (mediaType === 'audio') {
    whereClause.message_type = 'audio'
  } else if (mediaType === 'document') {
    whereClause.message_type = 'document'
  } else if (mediaType === 'links') {
    whereClause.message_text = { [Op.iLike]: '%http%' }
  } else {
    // All attachments
    whereClause[Op.or] = [
      { message_type: { [Op.in]: ['image', 'video', 'audio', 'document'] } },
      { media: { [Op.ne]: null } }
    ]
  }

  const mediaMessages = await Message.findAll({
    where: whereClause,
    order: [['created_at', 'DESC']],
    limit: 100,
    include: [
      {
        model: User,
        as: 'Sender',
        attributes: ['id'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name'] }]
      }
    ]
  })

  return mediaMessages.map((m) => m.toJSON())
}

// 4. STARRED MESSAGES
export const getStarredMessages = async (roomId, userId) => {
  const tripRoom = await resolveTripRoom(roomId)
  const roomIds = tripRoom ? [tripRoom.id, roomId] : [roomId]

  const stars = await MessageStar.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Message,
        where: { trip_room_id: { [Op.in]: roomIds }, deleted_for: { [Op.ne]: 'everyone' } },
        include: [
          {
            model: User,
            as: 'Sender',
            attributes: ['id'],
            include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
          }
        ]
      }
    ],
    order: [['created_at', 'DESC']]
  })

  return stars.map((s) => ({
    ...s.Message.toJSON(),
    is_starred: true,
    starred_at: s.created_at
  }))
}

// 5. FORWARD MESSAGE
export const forwardMessage = async (messageId, targetRoomId, userId) => {
  const original = await Message.findByPk(messageId)
  if (!original) return null

  const targetRoom = await resolveTripRoom(targetRoomId)

  return await Message.create({
    trip_room_id: targetRoom.id,
    sender_id: userId,
    message_type: original.message_type,
    message_text: original.message_text,
    media: original.media,
    location_data: original.location_data,
    contact_data: original.contact_data,
    deleted_for: 'none',
    created_at: new Date(),
    updated_at: new Date()
  })
}

// 6. UPDATE ROOM SETTINGS (Rename, Photo, Archive)
export const updateRoomSettings = async (roomId, settings = {}) => {
  let room = await TripRoom.findOne({ where: { activity_id: roomId } })
  if (!room) {
    room = await TripRoom.create({ activity_id: roomId })
  }

  if (settings.roomName !== undefined) room.room_name = settings.roomName
  if (settings.roomPhotoUrl !== undefined) room.room_photo_url = settings.roomPhotoUrl
  if (settings.status !== undefined) {
    room.status = settings.status
    if (settings.status === 'archived') {
      room.archived_at = new Date()
    }
  }
  if (settings.chatEnabled !== undefined) room.chat_enabled = settings.chatEnabled

  await room.save()
  return room
}

// 7. MUTE ROOM NOTIFICATIONS
export const muteRoomNotifications = async (roomId, userId, durationMinutes) => {
  let until = null
  if (durationMinutes === 'always' || durationMinutes === -1) {
    until = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) // 100 years
  } else if (durationMinutes > 0) {
    until = new Date(Date.now() + durationMinutes * 60 * 1000)
  }

  await ActivityMember.update(
    { notification_muted_until: until },
    { where: { activity_id: roomId, user_id: userId } }
  )

  return { mutedUntil: until }
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
  msg.message_text = '🚫 This message was deleted'
  msg.deleted_for = 'everyone'
  msg.deleted_at = new Date()
  await msg.save()
  return msg
}

// 8. EXPENSES CRUD
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
        model: ExpensePayer,
        as: 'Payers',
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id'],
            include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
          }
        ]
      },
      {
        model: ExpenseSplit,
        as: 'Splits',
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id'],
            include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
          }
        ]
      }
    ]
  })
}

export const createExpenseWithSplits = async (activityId, payerId, amount, description, splitsList, payersList = []) => {
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
      is_settled: false // Settlement layer governs settlement, splits remain raw liability
    })
  )
  await Promise.all(splitPromises)

  // Create multi-payers if provided
  if (Array.isArray(payersList) && payersList.length > 0) {
    const payerPromises = payersList.map((p) =>
      ExpensePayer.create({
        expense_id: expense.id,
        user_id: p.userId,
        amount_paid: p.amount
      })
    )
    await Promise.all(payerPromises)
  }

  return await Expense.findByPk(expense.id, {
    include: [
      { model: ExpenseSplit, as: 'Splits' },
      { model: ExpensePayer, as: 'Payers' }
    ]
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

// 9. POLLS CRUD
export const getPollsByActivity = async (activityId) => {
  return await Poll.findAll({
    where: { activity_id: activityId },
    order: [['created_at', 'DESC']]
  })
}

export const createPoll = async (activityId, creatorId, question, options) => {
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

// 10. CHECK-IN POINTS & LOGS
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

// 11. ONBOARDING STATUS
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

// 12. HEALTH DASHBOARD STATS
export const getHealthMetrics = async (activityId) => {
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
    const tenureMonths = (now - new Date(u.created_at || now)) / (1000 * 60 * 60 * 24 * 30)
    if (tenureMonths <= 1) newMembersCount++
    if (u.Profile?.gender === 'female') femaleCount++
    if (u.EmergencyContact) emergencySetCount++
  })

  const points = await CheckInPoint.findAll({ where: { activity_id: activityId } })
  const pointIds = points.map((p) => p.id)
  const logsCount = await CheckInLog.count({ where: { check_in_point_id: { [Op.in]: pointIds } } })
  const expectedCheckins = pointIds.length * totalMembers
  const pendingCheckins = Math.max(0, expectedCheckins - logsCount)
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
