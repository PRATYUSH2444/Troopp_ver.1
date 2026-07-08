import { Op, Sequelize } from 'sequelize'
import Activity from '../../models/Activity.js'
import Profile from '../../models/Profile.js'
import User from '../../models/User.js'
import ActivityMember from '../../models/ActivityMember.js'
import TripRoom from '../../models/TripRoom.js'
import TripRule from '../../models/TripRule.js'
import EmergencyContact from '../../models/EmergencyContact.js'
import Follow from '../../models/Follow.js'

import { computeVibeScore } from '../trust/vibeScore.util.js'
import { AppError } from '../../middleware/errorHandler.middleware.js'
import logger from '../../config/logger.js'

/**
 * Get all activities by city with conditional filters.
 */
export const getAllByCity = async (filters = {}, pagination = {}) => {
  const {
    cityId,
    status = 'open',
    type,
    isWomenOnly,
    minBudget,
    maxBudget,
    difficulty,
    maxGroupSize,
    startDate,
    endDate
  } = filters

  const { limit = 20, offset = 0 } = pagination

  // 1. Build where queries
  const whereClause = {
    status
  }

  if (cityId) whereClause.city_id = cityId
  if (type) whereClause.type = type
  if (isWomenOnly !== undefined) whereClause.is_women_only = isWomenOnly === 'true' || isWomenOnly === true

  if (difficulty) whereClause.difficulty_level = difficulty

  if (minBudget !== undefined || maxBudget !== undefined) {
    whereClause.cost_per_person = {}
    if (minBudget !== undefined) whereClause.cost_per_person[Op.gte] = parseFloat(minBudget)
    if (maxBudget !== undefined) whereClause.cost_per_person[Op.lte] = parseFloat(maxBudget)
  }

  if (maxGroupSize) {
    whereClause.max_group_size = { [Op.lte]: parseInt(maxGroupSize, 10) }
  }

  if (startDate || endDate) {
    whereClause.date_time = {}
    if (startDate) whereClause.date_time[Op.gte] = new Date(startDate)
    if (endDate) whereClause.date_time[Op.lte] = new Date(endDate)
  } else {
    // By default only show future activities
    whereClause.date_time = { [Op.gt]: new Date() }
  }

  // 2. Fetch from DB
  const { count, rows } = await Activity.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'Creator',
        attributes: ['id', 'email', 'trust_score', 'reliability_score', 'is_id_verified'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender'] }]
      }
    ],
    order: [['date_time', 'ASC']],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10)
  })

  return { total: count, activities: rows }
}

/**
 * Fetch activities created by users the current user follows.
 */
export const getByFollowing = async (userId, pagination = {}) => {
  const { limit = 20, offset = 0 } = pagination

  // 1. Get list of followed IDs
  const followed = await Follow.findAll({
    where: { follower_id: userId },
    attributes: ['following_id']
  })

  const creatorIds = followed.map((f) => f.following_id)

  if (creatorIds.length === 0) {
    return { total: 0, activities: [] }
  }

  // 2. Fetch activities
  const { count, rows } = await Activity.findAndCountAll({
    where: {
      creator_id: { [Op.in]: creatorIds },
      status: 'open',
      date_time: { [Op.gt]: new Date() }
    },
    include: [
      {
        model: User,
        as: 'Creator',
        attributes: ['id', 'email', 'trust_score', 'reliability_score', 'is_id_verified'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender'] }]
      }
    ],
    order: [['date_time', 'ASC']],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10)
  })

  return { total: count, activities: rows }
}

/**
 * Perform LIKE search on activity title or destination.
 */
export const search = async (query, cityId, pagination = {}) => {
  const { limit = 20, offset = 0 } = pagination
  const term = `%${query}%`

  const whereClause = {
    status: 'open',
    date_time: { [Op.gt]: new Date() },
    [Op.or]: [
      { title: { [Op.like]: term } },
      { destination: { [Op.like]: term } }
    ]
  }

  if (cityId) {
    whereClause.city_id = cityId
  }

  const { count, rows } = await Activity.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'Creator',
        attributes: ['id', 'email', 'trust_score', 'reliability_score', 'is_id_verified'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender'] }]
      }
    ],
    order: [['date_time', 'ASC']],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10)
  })

  return { total: count, activities: rows }
}

/**
 * Fetch detailed activity, confirmed members, and mutual connections.
 */
export const getByIdWithDetails = async (id, requestingUserId = null) => {
  const activity = await Activity.findByPk(id, {
    include: [
      {
        model: User,
        as: 'Creator',
        attributes: ['id', 'email', 'trust_score', 'reliability_score', 'is_id_verified'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender', 'bio'] }]
      },
      {
        model: TripRoom,
        as: 'TripRoom',
        attributes: ['id', 'status', 'chat_enabled']
      }
    ]
  })

  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  // 1. Fetch confirmed members
  const members = await ActivityMember.findAll({
    where: { activity_id: id, status: 'confirmed' },
    include: [
      {
        model: User,
        as: 'User',
        attributes: ['id', 'trust_score', 'reliability_score'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender'] }]
      }
    ]
  })

  // 2. Fetch mutual connections if requestingUserId is provided
  let mutualConnections = []
  if (requestingUserId) {
    const memberIds = members.map((m) => m.user_id)
    const follows = await Follow.findAll({
      where: {
        follower_id: requestingUserId,
        following_id: { [Op.in]: memberIds }
      },
      include: [
        {
          model: User,
          as: 'Following',
          include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
        }
      ]
    })
    mutualConnections = follows.map((f) => ({
      id: f.Following.id,
      name: f.Following.Profile?.name,
      avatar_url: f.Following.Profile?.avatar_url
    }))
  }

  return {
    activity,
    confirmedMembers: members,
    mutualConnections
  }
}

/**
 * Create a new Activity post, compute vibe tag, and setup session defaults.
 */
export const create = async (creatorId, data) => {
  // 1. Compute Vibe tag
  const vibeTag = computeVibeScore(
    data.type,
    data.cost_per_person,
    data.max_group_size,
    data.difficulty_level
  )

  // 2. Schedule auto close date time (default: 12 hours before event start)
  const eventTime = new Date(data.date_time)
  const autoCloseAt = new Date(eventTime.getTime() - 12 * 60 * 60 * 1000)

  const activity = await Activity.create({
    ...data,
    creator_id: creatorId,
    vibe_score_tag: vibeTag,
    current_members: 1, // Host is automatic first member
    status: 'open',
    auto_close_at: autoCloseAt
  })

  // 3. Create active Trip Room for chat
  const room = await TripRoom.create({
    activity_id: activity.id,
    name: `${data.title} - Group Chat`
  })

  // 4. Create Trip Rules placeholder
  await TripRule.create({
    activity_id: activity.id,
    language: 'english',
    members_can_add_expenses: true,
    members_can_create_polls: true,
    chat_before_full: true,
    moderated_mode: false,
    phone_sharing_enabled: false,
    checkin_required: false
  })

  // 5. Enroll host as first confirmed member
  await ActivityMember.create({
    activity_id: activity.id,
    user_id: creatorId,
    role: 'host',
    status: 'confirmed',
    joined_at: new Date()
  })

  return { activity, room }
}

/**
 * Update activity details within the allowed 24-hour edit window.
 */
export const update = async (id, data, creatorId) => {
  const activity = await Activity.findByPk(id)
  
  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  if (activity.creator_id !== creatorId) {
    throw new AppError('Access denied: You are not the creator of this activity.', 403, 'NOT_CREATOR')
  }

  // Enforce 24-hour edit freeze window
  const hoursRemaining = (new Date(activity.date_time) - new Date()) / (1000 * 60 * 60)
  if (hoursRemaining < 24) {
    throw new AppError('Editing is frozen. Trips cannot be modified under 24 hours of start time.', 400, 'EDIT_FROZEN')
  }

  // If cost/group changes, re-evaluate vibe tag
  const cost = data.cost_per_person !== undefined ? data.cost_per_person : activity.cost_per_person
  const size = data.max_group_size !== undefined ? data.max_group_size : activity.max_group_size
  const diff = data.difficulty_level !== undefined ? data.difficulty_level : activity.difficulty_level
  const type = data.type !== undefined ? data.type : activity.type

  const newVibe = computeVibeScore(type, cost, size, diff)

  await activity.update({
    ...data,
    vibe_score_tag: newVibe
  })

  return activity
}

/**
 * Cancel an activity, updating members and waitlist.
 */
export const cancel = async (id, creatorId) => {
  const activity = await Activity.findByPk(id)

  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  if (activity.creator_id !== creatorId) {
    throw new AppError('Access denied.', 403, 'NOT_CREATOR')
  }

  activity.status = 'cancelled'
  await activity.save()

  // Update all members to cancelled
  await ActivityMember.update(
    { status: 'cancelled' },
    { where: { activity_id: id, status: ['pending', 'confirmed', 'waitlisted'] } }
  )

  // Retrieve confirmed members for notification alerts
  const members = await ActivityMember.findAll({
    where: { activity_id: id, status: 'cancelled' },
    include: [{ model: User, as: 'User', attributes: ['id'] }]
  })

  return { activity, members }
}



/**
 * Approve a pending request to join the activity.
 */
export const approveJoin = async (activityId, requestId, creatorId) => {
  const activity = await Activity.findByPk(activityId)

  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  if (activity.creator_id !== creatorId) {
    throw new AppError('Access denied.', 403, 'NOT_HOST')
  }

  const member = await ActivityMember.findByPk(requestId)
  if (!member || member.activity_id !== activityId) {
    throw new AppError('Request not found.', 404, 'REQUEST_NOT_FOUND')
  }

  if (activity.current_members >= activity.max_group_size) {
    throw new AppError('Trip is already full.', 400, 'TRIP_FULL')
  }

  member.status = 'confirmed'
  member.joined_at = new Date()
  await member.save()

  // Increment spots count
  activity.current_members += 1
  if (activity.current_members === activity.max_group_size) {
    activity.status = 'full'
  }
  await activity.save()

  return { member, activity }
}

/**
 * Decline a pending request to join the activity.
 */
export const declineJoin = async (activityId, requestId, creatorId) => {
  const activity = await Activity.findByPk(activityId)

  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  if (activity.creator_id !== creatorId) {
    throw new AppError('Access denied.', 403, 'NOT_HOST')
  }

  const member = await ActivityMember.findByPk(requestId)
  if (!member || member.activity_id !== activityId) {
    throw new AppError('Request not found.', 404, 'REQUEST_NOT_FOUND')
  }

  member.status = 'declined'
  await member.save()

  return member
}

/**
 * Primary join gateway implementing the five pre-checks.
 */
export const getJoinRequests = async (activityId, creatorId) => {
  const activity = await Activity.findByPk(activityId)

  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  if (activity.creator_id !== creatorId) {
    throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
  }

  // Find user IDs blocked by host
  const BlockedUser = (await import('../../models/BlockedUser.js')).default
  const blockedList = await BlockedUser.findAll({
    where: { blocker_id: creatorId },
    attributes: ['blocked_id']
  })
  const blockedIds = blockedList.map((b) => b.blocked_id)

  const requests = await ActivityMember.findAll({
    where: {
      activity_id: activityId,
      status: 'pending',
      user_id: { [Op.notIn]: blockedIds } // Silent blocking filter
    },
    include: [
      {
        model: User,
        as: 'User',
        attributes: ['id', 'email', 'trust_score', 'reliability_score', 'is_id_verified'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender'] }]
      }
    ]
  })

  return requests
}

/**
 * Primary join gateway implementing the five pre-checks.
 */
export const joinActivity = async (activityId, userId, intent = 'request') => {
  const activity = await Activity.findByPk(activityId)
  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  if (activity.status === 'cancelled' || activity.status === 'completed') {
    throw new AppError('This trip is closed or cancelled.', 400, 'TRIP_CLOSED')
  }

  // 1. Check if user is already registered in the activity
  const existing = await ActivityMember.findOne({ where: { activity_id: activityId, user_id: userId } })
  if (existing && existing.status !== 'withdrawn' && existing.status !== 'declined') {
    throw new AppError('You have already applied or joined this trip.', 409, 'ALREADY_MEMBER')
  }

  // 2. Perform the 5 Core Security Pre-Join Checks
  const user = await User.findByPk(userId, {
    include: [
      { model: Profile, as: 'Profile' },
      { model: EmergencyContact, as: 'EmergencyContacts' }
    ]
  })

  // Rule A: Government ID must be verified
  if (!user.is_id_verified) {
    throw new AppError('Government identity verification is required to join groups.', 403, 'CHECK_ID_FAILED')
  }

  // Rule B: Emergency contacts must be registered
  if (!user.EmergencyContacts || user.EmergencyContacts.length === 0) {
    throw new AppError('At least one emergency contact must be set up.', 403, 'CHECK_EMERGENCY_FAILED')
  }

  // Rule C: Trust score thresholds
  if (user.trust_score < activity.min_trust_score) {
    throw new AppError(`Your Trust Score (${user.trust_score}) does not meet this trip's requirement (${activity.min_trust_score}).`, 403, 'CHECK_TRUST_FAILED')
  }

  // Rule D: Reliability score thresholds
  if (user.reliability_score < activity.min_reliability_score) {
    throw new AppError(`Your Reliability Score (${user.reliability_score}) does not meet requirements (${activity.min_reliability_score}).`, 403, 'CHECK_RELIABILITY_FAILED')
  }

  // Rule E: Gender composition checks
  if (activity.is_women_only && user.Profile?.gender !== 'female') {
    throw new AppError('This activity is restricted to verified female members only.', 403, 'CHECK_GENDER_FAILED')
  }

  // Check if requesting user is blocked by creator (Silent blocking check)
  const BlockedUser = (await import('../../models/BlockedUser.js')).default
  const isBlocked = await BlockedUser.findOne({
    where: { blocker_id: activity.creator_id, blocked_id: userId }
  })

  // 3. Determine status: waitlisted, confirmed (for auto-approve visibility), or pending
  let status = 'pending'
  let position = 0

  if (activity.current_members >= activity.max_group_size) {
    // Count active waitlisted members
    const waitlistCount = await ActivityMember.count({
      where: { activity_id: activityId, status: 'waitlisted' }
    })
    
    // Check waitlist cap (cannot exceed max group limit)
    if (waitlistCount >= activity.max_group_size) {
      throw new AppError('Waitlist queue is full.', 400, 'WAITLIST_FULL')
    }
    
    status = 'waitlisted'
    position = waitlistCount + 1
  } else if (activity.visibility === 'open' && intent === 'confirm' && activity.min_trust_score === 0) {
    // Auto-approve open trips with no trust barriers (unless blocked)
    if (!isBlocked) {
      status = 'confirmed'
      activity.current_members += 1
      if (activity.current_members === activity.max_group_size) {
        activity.status = 'full'
      }
      await activity.save()
    }
  }

  let member = existing
  if (member) {
    member.status = status
    member.position = position
    member.joined_at = new Date()
    await member.save()
  } else {
    member = await ActivityMember.create({
      activity_id: activityId,
      user_id: userId,
      status,
      position,
      role: 'member',
      joined_at: new Date()
    })
  }

  return { member, activity, silentlyBlocked: !!isBlocked }
}

/**
 * Withdraw from activity, calculating reliability penalties.
 */
export const withdrawFromActivity = async (activityId, userId, reason = '') => {
  const activity = await Activity.findByPk(activityId)
  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  const member = await ActivityMember.findOne({ where: { activity_id: activityId, user_id: userId } })
  if (!member || (member.status !== 'confirmed' && member.status !== 'waitlisted')) {
    throw new AppError('You are not active or waitlisted in this activity.', 400, 'NOT_ACTIVE_MEMBER')
  }

  const hoursUntilTrip = (new Date(activity.date_time) - new Date()) / (1000 * 60 * 60)
  const isLateWithdrawal = member.status === 'confirmed' && hoursUntilTrip < 24
  const oldStatus = member.status
  const oldPosition = member.position

  member.status = 'withdrawn'
  member.position = 0
  await member.save()

  let promotedMember = null

  if (oldStatus === 'confirmed') {
    // 2. Reduce spots count
    activity.current_members = Math.max(1, activity.current_members - 1)
    if (activity.status === 'full' && activity.current_members < activity.max_group_size) {
      activity.status = 'open'
    }
    await activity.save()

    // 3. Promote top waitlisted person (position 1) automatically
    const nextInWaitlist = await ActivityMember.findOne({
      where: { activity_id: activityId, status: 'waitlisted', position: 1 }
    })

    if (nextInWaitlist) {
      nextInWaitlist.status = 'confirmed'
      nextInWaitlist.position = 0
      await nextInWaitlist.save()

      activity.current_members += 1
      if (activity.current_members === activity.max_group_size) {
        activity.status = 'full'
      }
      await activity.save()

      // Decrement position index of remaining waitlist queue
      await ActivityMember.update(
        { position: Sequelize.literal('position - 1') },
        { where: { activity_id: activityId, status: 'waitlisted', position: { [Op.gt]: 1 } } }
      )

      promotedMember = nextInWaitlist
    }
  } else if (oldStatus === 'waitlisted') {
    // Shift queue positions of users behind the withdrawn member forward
    await ActivityMember.update(
      { position: Sequelize.literal('position - 1') },
      { where: { activity_id: activityId, status: 'waitlisted', position: { [Op.gt]: oldPosition } } }
    )
  }

  return { member, activity, isLateWithdrawal, promotedMember }
}

/**
 * Audit Query: Retrieves all trust metrics for MemberTrustCard.
 */
export const getMemberTrustCard = async (userId, requestingUserId = null) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'email', 'trust_score', 'reliability_score', 'is_id_verified', 'is_face_verified', 'created_at'],
    include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender', 'bio'] }]
  })

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND')
  }

  // 1. Trips completed (attending activities starting in the past)
  // We can count rows where user is confirmed and the activity start time has passed
  const tripsCompleted = await ActivityMember.count({
    where: { user_id: userId, status: 'confirmed' },
    include: [{
      model: Activity,
      as: 'Activity',
      where: { date_time: { [Op.lt]: new Date() } }
    }]
  })

  // 2. Positive rating % (average of rater scores where rated = user and score >= 4)
  // Since Rating model might not be directly imported, we can lazy import or require it
  const Rating = (await import('../../models/Rating.js')).default
  const totalRatings = await Rating.count({ where: { rated_id: userId } })
  const positiveRatings = await Rating.count({ where: { rated_id: userId, score: { [Op.gte]: 4 } } })
  const positiveRatingPct = totalRatings > 0 ? Math.round((positiveRatings / totalRatings) * 100) : 100

  // 3. Platform tenure in months
  const months = Math.max(1, Math.ceil((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 30)))

  // 4. Valid reports count (resolved reports submitted against the user)
  const Report = (await import('../../models/Report.js')).default
  const validReportsCount = await Report.count({
    where: { reported_id: userId, status: 'resolved' }
  })

  // 5. Mutual connections count (follows intersection)
  let mutualConnections = []
  if (requestingUserId) {
    const myFollows = await Follow.findAll({ where: { follower_id: requestingUserId }, attributes: ['following_id'] })
    const userFollows = await Follow.findAll({ where: { follower_id: userId }, attributes: ['following_id'] })

    const myFollowedIds = myFollows.map((f) => f.following_id)
    const userFollowedIds = userFollows.map((f) => f.following_id)

    const mutualIds = myFollowedIds.filter((id) => userFollowedIds.includes(id))

    if (mutualIds.length > 0) {
      const mutualUsers = await User.findAll({
        where: { id: { [Op.in]: mutualIds } },
        include: [{ model: Profile, as: 'Profile', attributes: ['name'] }]
      })
      mutualConnections = mutualUsers.map((u) => u.Profile?.name).filter(Boolean)
    }
  }

  return {
    id: user.id,
    name: user.Profile?.name || 'Explorer',
    avatar_url: user.Profile?.avatar_url,
    gender: user.Profile?.gender || 'prefer_not_to_say',
    bio: user.Profile?.bio || '',
    trust_score: user.trust_score,
    reliability_score: user.reliability_score,
    is_id_verified: user.is_id_verified,
    is_face_verified: user.is_face_verified,
    trips_completed: tripsCompleted,
    positive_rating_pct: positiveRatingPct,
    tenure_months: months,
    has_valid_reports: validReportsCount > 0,
    mutual_connections: mutualConnections
  }
}
