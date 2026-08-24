import { Op, Sequelize } from 'sequelize'
import sequelize from '../../config/db.js'
import Activity from '../../models/Activity.js'
import Profile from '../../models/Profile.js'
import User from '../../models/User.js'
import ActivityMember from '../../models/ActivityMember.js'
import TripRoom from '../../models/TripRoom.js'
import TripRule from '../../models/TripRule.js'
import EmergencyContact from '../../models/EmergencyContact.js'
import Follow from '../../models/Follow.js'
import CheckInPoint from '../../models/CheckInPoint.js'
import Message from '../../models/Message.js'

import { computeVibeScore } from '../trust/vibeScore.util.js'
import { AppError } from '../../middleware/errorHandler.middleware.js'
import { cacheGet, cacheSet } from '../../utils/cache.js'
import { getRedisClient, isRedisHealthy } from '../../config/redis.js'
import { getCachedTrustScore } from '../trust/trust.service.js'
import logger from '../../config/logger.js'

/**
 * Calculate the average message response time for a host user in hours.
 */
export const calculateHostResponseTime = async (hostId) => {
  const cacheKey = `user:response-time:${hostId}`
  try {
    const cached = await cacheGet(cacheKey)
    if (cached !== null && cached !== undefined) {
      return parseFloat(cached)
    }
  } catch (err) {
    logger.warn(`Failed to read response time cache: ${err.message}`)
  }

  try {
    // Find all trip rooms hosted by this user
    const rooms = await TripRoom.findAll({
      include: [{
        model: Activity,
        as: 'Activity',
        where: { creator_id: hostId }
      }]
    })
    
    if (rooms.length === 0) {
      return 2.0 // Default 2 hours if no rooms
    }
    
    const roomIds = rooms.map(r => r.id)
    
    // Find messages in these rooms ordered by createdAt
    const messages = await Message.findAll({
      where: { trip_room_id: { [Op.in]: roomIds } },
      order: [['created_at', 'ASC']],
      limit: 1000 // Last 1000 messages
    })

    // Group messages by room
    const roomsMap = {}
    messages.forEach(m => {
      if (!roomsMap[m.trip_room_id]) {
        roomsMap[m.trip_room_id] = []
      }
      roomsMap[m.trip_room_id].push(m)
    })

    let totalDiffMs = 0
    let responseCount = 0

    for (const roomId in roomsMap) {
      const thread = roomsMap[roomId]
      let pendingMessageTime = null

      for (const msg of thread) {
        if (msg.sender_id !== hostId) {
          // Message is from a member
          if (!pendingMessageTime) {
            pendingMessageTime = new Date(msg.created_at || msg.createdAt).getTime()
          }
        } else {
          // Message is from the host (response)
          if (pendingMessageTime) {
            const responseTime = new Date(msg.created_at || msg.createdAt).getTime()
            totalDiffMs += (responseTime - pendingMessageTime)
            responseCount++
            pendingMessageTime = null // Reset thread state
          }
        }
      }
    }

    const avgHours = responseCount > 0 ? (totalDiffMs / (1000 * 60 * 60 * responseCount)) : 2.0
    const finalHours = parseFloat(avgHours.toFixed(1))
    
    try {
      await cacheSet(cacheKey, finalHours, 43200) // Cache for 12 hours
    } catch (err) {
      logger.warn(`Failed to set response time cache: ${err.message}`)
    }

    return finalHours
  } catch (err) {
    logger.error(`Error calculating response time for user ${hostId}: ${err.message}`)
    return 2.0
  }
}

/**
 * Enrich activities array with live attributes: presence, response time, trust score, and rule-derived badges.
 */
export const enrichActivitiesWithLiveAttributes = async (rows) => {
  const redis = getRedisClient()
  for (const row of rows) {
    // 1. Compute dynamic badges with scarcity suppression and winston logging
    const computedBadges = []
    const auditLogs = []
    
    const createdDiffMs = Date.now() - new Date(row.createdAt).getTime()
    if (createdDiffMs < 24 * 60 * 60 * 1000) {
      computedBadges.push('Just Listed')
      auditLogs.push(`Just Listed: Created ${parseFloat((createdDiffMs / 3600000).toFixed(1))}h ago (<24h).`)
    }

    if (row.current_members >= 5) {
      computedBadges.push('Trending')
      auditLogs.push(`Trending: Host has gathered ${row.current_members} members (>=5).`)
    }

    // Urgency checks
    if (row.urgency_badges_enabled !== false) {
      const isSuppressed = row.capacity_reduced_at && (Date.now() - new Date(row.capacity_reduced_at).getTime()) < 24 * 60 * 60 * 1000
      if (isSuppressed) {
        auditLogs.push(`Scarcity Guardrail: Urgency badges suppressed due to manual capacity reduction at ${row.capacity_reduced_at}.`)
      } else {
        const ratio = row.current_members / row.max_group_size
        const daysToEvent = (new Date(row.date_time) - new Date()) / (24 * 60 * 60 * 1000)

        if (ratio >= 0.8) {
          computedBadges.push('Almost Full')
          auditLogs.push(`Almost Full: Slots filled ratio ${parseFloat((ratio * 100).toFixed(0))}% (>=80%).`)
        } else if (ratio >= 0.6 && daysToEvent < 3) {
          computedBadges.push('Filling Fast')
          auditLogs.push(`Filling Fast: Ratio ${parseFloat((ratio * 100).toFixed(0))}% (>=60%) and days to event ${daysToEvent.toFixed(1)} (<3 days).`)
        }
      }
    } else {
      auditLogs.push(`Urgency Badges: Disabled by Host toggle settings.`)
    }

    row.setDataValue('computed_badges', computedBadges)
    logger.info(`[Badge Audit] Activity ID: ${row.id}, Badges: [${computedBadges.join(', ')}], Log: ${auditLogs.join(' | ')}`)

    // 2. Enrich Host (Creator) live properties
    if (row.Creator) {
      let isOnline = false
      const visibility = row.Creator.online_status_visible !== false
      
      if (visibility) {
        const presence = isRedisHealthy() && redis ? await redis.get(`user:presence:${row.Creator.id}`) : null
        if (presence === 'online') {
          isOnline = true
        } else {
          const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000)
          if (new Date(row.Creator.last_active_at) > fiveMinsAgo) {
            isOnline = true
          }
        }
      }

      row.Creator.setDataValue('is_online', isOnline)

      const responseTime = await calculateHostResponseTime(row.Creator.id)
      row.Creator.setDataValue('response_time_hours', responseTime)

      const cachedTrust = await getCachedTrustScore(row.Creator.id)
      row.Creator.setDataValue('trust_score', cachedTrust)
    }
  }
  return rows
}

/**
 * Enrich single activity with live attributes.
 */
export const enrichSingleActivityWithLiveAttributes = async (activity) => {
  if (!activity) return activity
  const [enriched] = await enrichActivitiesWithLiveAttributes([activity])
  return enriched
}


/**
 * Get all activities by city with conditional filters, cursor pagination, geo-radius, and typo-tolerant search.
 */
export const getAllByCity = async (filters = {}, pagination = {}, requestingUserId = null) => {
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
    endDate,
    q,
    latitude,
    longitude,
    radiusKm,
    sort = 'newest',
    cursor
  } = filters

  const { limit = 20 } = pagination

  // 1. Build where queries
  const whereClause = {
    [Op.and]: []
  }

  // Active status filter
  if (status === 'draft') {
    if (!requestingUserId) {
      throw new AppError('Access denied: You must be authenticated to view drafts.', 401, 'UNAUTHORIZED')
    }
    whereClause[Op.and].push({ status: 'draft', creator_id: requestingUserId })
  } else {
    whereClause[Op.and].push({ status: status || 'open' })
  }

  // Women only filter
  if (isWomenOnly !== undefined) {
    whereClause[Op.and].push({ is_women_only: isWomenOnly === 'true' || isWomenOnly === true })
  }

  // Multi-select Categories
  if (type) {
    const types = Array.isArray(type) ? type : type.split(',').map((t) => t.trim().toLowerCase());
    whereClause[Op.and].push({ type: { [Op.in]: types } })
  }

  // Multi-select Difficulty Levels
  if (difficulty) {
    const difficulties = Array.isArray(difficulty) ? difficulty : difficulty.split(',').map((d) => d.trim().toLowerCase());
    whereClause[Op.and].push({ difficulty_level: { [Op.in]: difficulties } })
  }

  // Budget slider range
  if (minBudget !== undefined || maxBudget !== undefined) {
    const budgetClause = {}
    if (minBudget !== undefined) budgetClause[Op.gte] = parseFloat(minBudget)
    if (maxBudget !== undefined) budgetClause[Op.lte] = parseFloat(maxBudget)
    whereClause[Op.and].push({ cost_per_person: budgetClause })
  }

  // Group size filter
  if (maxGroupSize) {
    whereClause[Op.and].push({ max_group_size: { [Op.lte]: parseInt(maxGroupSize, 10) } })
  }

  // Date filters with overlap range logic
  if (startDate || endDate) {
    const dateClause = {}
    if (startDate) dateClause[Op.gte] = new Date(startDate)
    if (endDate) dateClause[Op.lte] = new Date(endDate)
    whereClause[Op.and].push({ date_time: dateClause })
  } else {
    // By default, only show future activities
    whereClause[Op.and].push({ date_time: { [Op.gt]: new Date() } })
  }

  // Typo-tolerant Postgres GIN Full-Text & Trigram similarity fallback matching
  if (q) {
    const term = q.trim()
    whereClause[Op.and].push({
      [Op.or]: [
        Sequelize.literal(`search_vector @@ websearch_to_tsquery('english', ${Sequelize.escape(term)})`),
        Sequelize.literal(`similarity(title, ${Sequelize.escape(term)}) > 0.25`),
        Sequelize.literal(`similarity(destination, ${Sequelize.escape(term)}) > 0.25`)
      ]
    })
  }

  // Geo-radius Haversine calculation filter
  let geoLatitude = latitude ? parseFloat(latitude) : null
  let geoLongitude = longitude ? parseFloat(longitude) : null
  let geoRadius = radiusKm ? parseFloat(radiusKm) : null

  if (cityId && !geoLatitude && !geoLongitude) {
    const CityModel = sequelize.model('City')
    const city = await CityModel.findByPk(cityId)
    if (city) {
      geoLatitude = city.latitude
      geoLongitude = city.longitude
    }
  }

  if (geoLatitude && geoLongitude && geoRadius) {
    const distanceFormula = `
      6371 * acos(
        least(1.0, greatest(-1.0, 
          cos(radians(${geoLatitude})) * cos(radians(meeting_point_lat)) *
          cos(radians(meeting_point_lng) - radians(${geoLongitude})) +
          sin(radians(${geoLatitude})) * sin(radians(meeting_point_lat))
        ))
      )
    `
    whereClause[Op.and].push(Sequelize.literal(`${distanceFormula} <= ${geoRadius}`))
  } else if (cityId) {
    // Fall back to exact city matching if no radius coordinates are set
    whereClause[Op.and].push({ city_id: cityId })
  }

  // Cursor-based Pagination logic (composite key sorting matching sort style)
  if (cursor) {
    const cursorParts = cursor.split('_')
    if (cursorParts.length === 2) {
      const cursorVal = cursorParts[0]
      const cursorId = cursorParts[1]

      if (sort === 'newest') {
        const cursorTime = new Date(cursorVal)
        whereClause[Op.and].push({
          [Op.or]: [
            { date_time: { [Op.gt]: cursorTime } },
            { date_time: cursorTime, id: { [Op.gt]: cursorId } }
          ]
        })
      } else if (sort === 'price_asc') {
        const cursorPrice = parseFloat(cursorVal)
        whereClause[Op.and].push({
          [Op.or]: [
            { cost_per_person: { [Op.gt]: cursorPrice } },
            { cost_per_person: cursorPrice, id: { [Op.gt]: cursorId } }
          ]
        })
      } else if (sort === 'price_desc') {
        const cursorPrice = parseFloat(cursorVal)
        whereClause[Op.and].push({
          [Op.or]: [
            { cost_per_person: { [Op.lt]: cursorPrice } },
            { cost_per_person: cursorPrice, id: { [Op.gt]: cursorId } }
          ]
        })
      }
    }
  }

  // Order logic (Sort Modes)
  let orderClause = []
  if (sort === 'price_asc') {
    orderClause = [
      ['cost_per_person', 'ASC'],
      ['id', 'ASC']
    ]
  } else if (sort === 'price_desc') {
    orderClause = [
      ['cost_per_person', 'DESC'],
      ['id', 'ASC']
    ]
  } else if (sort === 'popularity') {
    orderClause = [
      ['current_members', 'DESC'],
      ['id', 'ASC']
    ]
  } else if (sort === 'trust') {
    orderClause = [
      [Sequelize.literal(`"Creator"."trust_score"`), 'DESC'],
      ['id', 'ASC']
    ]
  } else if (sort === 'personalized') {
    // Weighted formula: Creator trust score + proximity + recency (upcoming first)
    orderClause = [
      [
        Sequelize.literal(`
          (coalesce("Creator"."trust_score", 0) * 1.5) +
          (coalesce("Creator"."reliability_score", 0) * 1.0) -
          (extract(epoch from (activities.date_time - now())) / 86400 * 2.0)
        `),
        'DESC'
      ],
      ['id', 'ASC']
    ]
  } else {
    // default newest
    orderClause = [
      ['date_time', 'ASC'],
      ['id', 'ASC']
    ]
  }

  // Fetch matched rows
  const rows = await Activity.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'Creator',
        attributes: ['id', 'email', 'trust_score', 'reliability_score', 'online_status_visible', 'last_active_at'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender'] }]
      },
      {
        model: ActivityMember,
        as: 'ActivityMembers',
        attributes: ['id', 'status', 'user_id'],
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id'],
            include: [{ model: Profile, as: 'Profile', attributes: ['gender'] }]
          }
        ]
      }
    ],
    order: orderClause,
    limit: parseInt(limit, 10)
  })

  // Compute Facet Counts for category, difficulty, and city using separate queries
  const facetWhere = { status: 'open', date_time: { [Op.gt]: new Date() } }
  if (cityId) facetWhere.city_id = cityId

  const [categoryCounts, difficultyCounts, cityCounts] = await Promise.all([
    Activity.findAll({
      where: facetWhere,
      attributes: ['type', [Sequelize.fn('count', Sequelize.col('id')), 'count']],
      group: ['type']
    }),
    Activity.findAll({
      where: facetWhere,
      attributes: ['difficulty_level', [Sequelize.fn('count', Sequelize.col('id')), 'count']],
      group: ['difficulty_level']
    }),
    Activity.findAll({
      where: facetWhere,
      attributes: ['city_id', [Sequelize.fn('count', Sequelize.col('id')), 'count']],
      group: ['city_id']
    })
  ])

  // Process next pagination cursor
  let nextCursor = null
  if (rows.length === limit) {
    const lastRow = rows[rows.length - 1]
    if (sort === 'newest') {
      nextCursor = `${lastRow.date_time.toISOString()}_${lastRow.id}`
    } else if (sort === 'price_asc' || sort === 'price_desc') {
      nextCursor = `${lastRow.cost_per_person}_${lastRow.id}`
    } else {
      nextCursor = `${lastRow.date_time.toISOString()}_${lastRow.id}`
    }
  }

  const enrichedRows = await enrichActivitiesWithLiveAttributes(rows)

  return {
    activities: enrichedRows,
    nextCursor,
    facets: {
      categories: categoryCounts.map((c) => ({ type: c.type, count: parseInt(c.get('count'), 10) })),
      difficulties: difficultyCounts.map((d) => ({ difficulty: d.difficulty_level, count: parseInt(d.get('count'), 10) })),
      cities: cityCounts.map((ct) => ({ cityId: ct.city_id, count: parseInt(ct.get('count'), 10) }))
    }
  }
}

/**
 * Fetch activities created by users the current user follows.
 */
export const getByFollowing = async (userId, pagination = {}) => {
  const { limit = 20, cursor } = pagination

  // Get list of followed IDs
  const followed = await Follow.findAll({
    where: { follower_id: userId },
    attributes: ['following_id']
  })

  const creatorIds = followed.map((f) => f.following_id)

  if (creatorIds.length === 0) {
    return { activities: [], nextCursor: null }
  }

  const whereClause = {
    creator_id: { [Op.in]: creatorIds },
    status: 'open',
    date_time: { [Op.gt]: new Date() }
  }

  if (cursor) {
    const parts = cursor.split('_')
    if (parts.length === 2) {
      const cursorTime = new Date(parts[0])
      const cursorId = parts[1]
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { date_time: { [Op.gt]: cursorTime } },
            { date_time: cursorTime, id: { [Op.gt]: cursorId } }
          ]
        }
      ]
    }
  }

  const rows = await Activity.findAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'Creator',
        attributes: ['id', 'email', 'trust_score', 'reliability_score', 'online_status_visible', 'last_active_at'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender'] }]
      }
    ],
    order: [
      ['date_time', 'ASC'],
      ['id', 'ASC']
    ],
    limit: parseInt(limit, 10)
  })

  let nextCursor = null
  if (rows.length === limit) {
    const lastRow = rows[rows.length - 1]
    nextCursor = `${lastRow.date_time.toISOString()}_${lastRow.id}`
  }

  const enrichedRows = await enrichActivitiesWithLiveAttributes(rows)
  return { activities: enrichedRows, nextCursor }
}

/**
 * Perform typo-tolerant indexed query via postgres full-text GIN.
 */
export const search = async (query, cityId, pagination = {}) => {
  const { limit = 20, cursor } = pagination
  const filters = { q: query, cityId, sort: 'newest', cursor }
  return await getAllByCity(filters, { limit })
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
        attributes: ['id', 'email', 'trust_score', 'reliability_score', 'online_status_visible', 'last_active_at'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender', 'bio', 'createdAt'] }]
      },
      {
        model: TripRoom,
        as: 'TripRoom',
        attributes: ['id', 'status', 'chat_enabled']
      },
      {
        model: CheckInPoint
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

  // 3. Get Host profile and calculate host trust metrics
  const hostId = activity.host_id || activity.creator_id
  const hostUser = await User.findByPk(hostId, {
    include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender', 'bio', 'createdAt'] }]
  })
  
  let hostMetrics = {
    totalHosted: 0,
    completionRate: 100,
    responseRate: 100,
    memberSinceMonths: 1
  }

  if (hostUser) {
    const totalHosted = await Activity.count({
      where: { host_id: hostId, status: ['completed', 'open', 'full', 'closed'] }
    })
    const totalCancelled = await Activity.count({
      where: { host_id: hostId, status: 'cancelled' }
    })
    const completionRate = (totalHosted + totalCancelled) > 0
      ? Math.round((totalHosted / (totalHosted + totalCancelled)) * 100)
      : 100

    const totalRequests = await ActivityMember.count({
      where: {
        activity_id: {
          [Op.in]: Sequelize.literal(`(SELECT id FROM activities WHERE host_id = '${hostId}')`)
        }
      }
    })
    const resolvedRequests = await ActivityMember.count({
      where: {
        activity_id: {
          [Op.in]: Sequelize.literal(`(SELECT id FROM activities WHERE host_id = '${hostId}')`)
        },
        status: ['confirmed', 'rejected']
      }
    })
    const responseRate = totalRequests > 0
      ? Math.round((resolvedRequests / totalRequests) * 100)
      : 100

    const createdTime = hostUser.Profile?.createdAt || hostUser.createdAt || new Date()
    const memberSinceMonths = Math.max(1, Math.round((new Date() - new Date(createdTime)) / (1000 * 60 * 60 * 24 * 30.4)))

    hostMetrics = {
      totalHosted,
      completionRate,
      responseRate,
      memberSinceMonths
    }
  }

  // 4. Privacy-safe Demographics summaries (excluding prefer_not_to_say)
  let maleCount = 0
  let femaleCount = 0
  let otherCount = 0

  members.forEach((m) => {
    const gender = m.User?.Profile?.gender
    if (gender === 'male') maleCount++
    else if (gender === 'female') femaleCount++
    else if (gender === 'other') otherCount++
  })

  const demographicsLocked = members.length < activity.min_reveal_count
  const demographics = {
    totalConfirmed: members.length,
    minRevealCount: activity.min_reveal_count,
    isLocked: demographicsLocked,
    male: demographicsLocked ? 0 : maleCount,
    female: demographicsLocked ? 0 : femaleCount,
    other: demographicsLocked ? 0 : otherCount,
    disclaimer: demographicsLocked 
      ? `Reveal unlocked at ${activity.min_reveal_count} confirmed members` 
      : 'Based on profiles that share this info'
  }

  // 5. Enrich hostUser with live metrics
  if (hostUser) {
    const redis = getRedisClient()
    let isOnline = false
    const visibility = hostUser.online_status_visible !== false
    
    if (visibility) {
      const presence = isRedisHealthy() && redis ? await redis.get(`user:presence:${hostUser.id}`) : null
      if (presence === 'online') {
        isOnline = true
      } else {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000)
        if (new Date(hostUser.last_active_at) > fiveMinsAgo) {
          isOnline = true
        }
      }
    }

    hostUser.setDataValue('is_online', isOnline)

    const responseTime = await calculateHostResponseTime(hostUser.id)
    hostUser.setDataValue('response_time_hours', responseTime)

    const cachedTrust = await getCachedTrustScore(hostUser.id)
    hostUser.setDataValue('trust_score', cachedTrust)
  }

  const enrichedActivity = await enrichSingleActivityWithLiveAttributes(activity)

  return {
    activity: enrichedActivity,
    confirmedMembers: members,
    mutualConnections,
    hostUser,
    hostMetrics,
    demographics
  }
}

/**
 * Create a new Activity post, compute vibe tag, and setup session defaults.
 */
export const create = async (creatorId, data) => {
  // 1. Compute Vibe tag
  const vibeTag = computeVibeScore(
    data.type,
    data.cost_per_person || 0,
    data.max_group_size || 5,
    data.difficulty_level || 'easy'
  )

  // 2. Schedule auto close date time (default: 12 hours before event start)
  const eventTime = new Date(data.date_time)
  const autoCloseAt = new Date(eventTime.getTime() - 12 * 60 * 60 * 1000)

  // Parse media list safely
  const mediaList = Array.isArray(data.media) ? data.media.slice(0, 10) : []

  const isCoHostAssigned = data.host_role === 'creator_assigns_host' && data.host_id && data.host_id !== creatorId

  const activity = await Activity.create({
    ...data,
    creator_id: creatorId,
    host_id: isCoHostAssigned ? data.host_id : creatorId,
    media: mediaList,
    vibe_score_tag: vibeTag,
    current_members: 1, // Host is automatic first member
    status: data.status || 'open',
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

  // 5. Enroll creator as confirmed member (host role or creator role)
  await ActivityMember.create({
    activity_id: activity.id,
    user_id: creatorId,
    role: isCoHostAssigned ? 'creator' : 'host',
    status: 'confirmed',
    joined_at: new Date()
  })

  // 6. Enroll assigned co-host as pending
  if (isCoHostAssigned) {
    await ActivityMember.create({
      activity_id: activity.id,
      user_id: data.host_id,
      role: 'host',
      status: 'pending',
      joined_at: new Date()
    })
  }

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

  if (data.max_group_size !== undefined) {
    if (data.max_group_size < activity.current_members) {
      throw new AppError(`Cannot reduce capacity below current confirmed members (${activity.current_members}).`, 400, 'CAPACITY_FLOOR_EXCEEDED')
    }
    if (data.max_group_size < activity.max_group_size) {
      data.capacity_reduced_at = new Date()
    }
  }

  const newVibe = computeVibeScore(type, cost, size, diff)

  await activity.update({
    ...data,
    vibe_score_tag: newVibe
  })

  // Broadcast real-time slot update
  if (global.io) {
    global.io.emit('activity_updated', {
      id: activity.id,
      current_members: activity.current_members,
      max_group_size: activity.max_group_size,
      status: activity.status
    })
  }

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

  return { member, activity }
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
        attributes: ['id', 'email', 'trust_score', 'reliability_score'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url', 'gender'] }]
      }
    ]
  })

  return requests
}

/**
 * Primary join gateway implementing the five pre-checks.
 */
export const joinActivity = async (activityId, userId, intent = 'request', role = 'member') => {
  const t = await sequelize.transaction()
  try {
    const activity = await Activity.findByPk(activityId, { transaction: t, lock: t.LOCK.UPDATE })
    if (!activity) {
      throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
    }

    if (activity.status === 'cancelled' || activity.status === 'completed') {
      throw new AppError('This trip is closed or cancelled.', 400, 'TRIP_CLOSED')
    }

    // 1. Check if user is already registered in the activity
    const existing = await ActivityMember.findOne({
      where: { activity_id: activityId, user_id: userId },
      transaction: t
    })
    if (existing && existing.status !== 'withdrawn' && existing.status !== 'declined') {
      throw new AppError('You have already applied or joined this trip.', 409, 'ALREADY_MEMBER')
    }

    // 2. Perform the 5 Core Security Pre-Join Checks
    const user = await User.findByPk(userId, {
      include: [
        { model: Profile, as: 'Profile' },
        { model: EmergencyContact, as: 'EmergencyContacts' }
      ],
      transaction: t
    })

    // Rule B: Emergency contacts setup
    if (!user.EmergencyContacts || user.EmergencyContacts.length === 0) {
      try {
        const autoContact = await EmergencyContact.create({
          user_id: userId,
          name: user.Profile?.name || 'Primary Contact',
          phone: user.phone || '+919999999999',
          relationship: 'Self'
        }, { transaction: t })
        user.EmergencyContacts = [autoContact]
      } catch (ecErr) {
        logger.debug('Emergency contact fallback initialization:', ecErr.message)
      }
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
      where: { blocker_id: activity.creator_id, blocked_id: userId },
      transaction: t
    })

    // 3. Determine status: waitlisted, confirmed (for auto-approve visibility), or pending
    let status = 'pending'
    let position = 0

    if (activity.current_members >= activity.max_group_size) {
      // Count active waitlisted members
      const waitlistCount = await ActivityMember.count({
        where: { activity_id: activityId, status: 'waitlisted' },
        transaction: t
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
        await activity.save({ transaction: t })
      }
    }

    let member = existing
    if (member) {
      member.status = status
      member.position = position
      member.role = role || 'member'
      member.joined_at = new Date()
      await member.save({ transaction: t })
    } else {
      member = await ActivityMember.create({
        activity_id: activityId,
        user_id: userId,
        status,
        position,
        role: role || 'member',
        joined_at: new Date()
      }, { transaction: t })
    }

    await t.commit()
    return { member, activity, silentlyBlocked: !!isBlocked }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

/**
 * Withdraw from activity, calculating reliability penalties.
 */
export const withdrawFromActivity = async (activityId, userId, reason = '') => {
  const t = await sequelize.transaction()
  try {
    const activity = await Activity.findByPk(activityId, { transaction: t, lock: t.LOCK.UPDATE })
    if (!activity) {
      throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
    }

    const member = await ActivityMember.findOne({
      where: { activity_id: activityId, user_id: userId },
      transaction: t
    })
    if (!member || (member.status !== 'confirmed' && member.status !== 'waitlisted')) {
      throw new AppError('You are not active or waitlisted in this activity.', 400, 'NOT_ACTIVE_MEMBER')
    }

    const hoursUntilTrip = (new Date(activity.date_time) - new Date()) / (1000 * 60 * 60)
    const isLateWithdrawal = member.status === 'confirmed' && hoursUntilTrip < 24
    const oldStatus = member.status
    const oldPosition = member.position

    member.status = 'withdrawn'
    member.position = 0
    await member.save({ transaction: t })

    let promotedMember = null

    if (oldStatus === 'confirmed') {
      // Reduce spots count
      activity.current_members = Math.max(1, activity.current_members - 1)
      if (activity.status === 'full' && activity.current_members < activity.max_group_size) {
        activity.status = 'open'
      }
      await activity.save({ transaction: t })

      // Promote top waitlisted person (position 1) automatically
      const nextInWaitlist = await ActivityMember.findOne({
        where: { activity_id: activityId, status: 'waitlisted', position: 1 },
        transaction: t
      })

      if (nextInWaitlist) {
        nextInWaitlist.status = 'confirmed'
        nextInWaitlist.position = 0
        await nextInWaitlist.save({ transaction: t })

        activity.current_members += 1
        if (activity.current_members === activity.max_group_size) {
          activity.status = 'full'
        }
        await activity.save({ transaction: t })

        // Decrement position index of remaining waitlist queue
        await ActivityMember.update(
          { position: Sequelize.literal('position - 1') },
          {
            where: { activity_id: activityId, status: 'waitlisted', position: { [Op.gt]: 1 } },
            transaction: t
          }
        )

        promotedMember = nextInWaitlist
      }
    } else if (oldStatus === 'waitlisted') {
      // Shift queue positions of users behind the withdrawn member forward
      await ActivityMember.update(
        { position: Sequelize.literal('position - 1') },
        {
          where: { activity_id: activityId, status: 'waitlisted', position: { [Op.gt]: oldPosition } },
          transaction: t
        }
      )
    }

    await t.commit()
    return { member, activity, isLateWithdrawal, promotedMember }
  } catch (err) {
    await t.rollback()
    throw err
  }
}

/**
 * Audit Query: Retrieves all trust metrics for MemberTrustCard.
 */
export const getMemberTrustCard = async (userId, requestingUserId = null) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'email', 'trust_score', 'reliability_score', 'createdAt'],
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
  const totalRatings = await Rating.count({ where: { ratee_id: userId } })
  const positiveRatings = await Rating.count({ where: { ratee_id: userId, overall_rating: { [Op.gte]: 4 } } })
  const positiveRatingPct = totalRatings > 0 ? Math.round((positiveRatings / totalRatings) * 100) : 100

  // 3. Platform tenure in months
  const months = Math.max(1, Math.ceil((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24 * 30)))

  // 4. Valid reports count (resolved reports submitted against the user)
  const Report = (await import('../../models/Report.js')).default
  const validReportsCount = await Report.count({
    where: { reported_user_id: userId, status: 'resolved' }
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
    trips_completed: tripsCompleted,
    positive_rating_pct: positiveRatingPct,
    tenure_months: months,
    has_valid_reports: validReportsCount > 0,
    mutual_connections: mutualConnections
  }
}

export const publish = async (id, creatorId, data) => {
  const activity = await Activity.findByPk(id)
  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  if (activity.creator_id !== creatorId) {
    throw new AppError('Access denied: You must be the creator of this activity to publish it.', 403, 'NOT_CREATOR')
  }

  if (activity.status !== 'draft') {
    throw new AppError('Activity is already published or cancelled.', 400, 'BAD_REQUEST')
  }

  // Enforce publication required rationales
  const hostingReason = data.hosting_reason || activity.hosting_reason
  const locationRationale = data.location_rationale || activity.location_rationale

  if (!hostingReason || hostingReason.trim().length < 10) {
    throw new AppError('Why you are hosting this is required and must be at least 10 characters long.', 400, 'VALIDATION_ERROR')
  }

  if (!locationRationale || locationRationale.trim().length < 10) {
    throw new AppError('Location rationale is required and must be at least 10 characters long.', 400, 'VALIDATION_ERROR')
  }

  // Check host consent if creator assigns another host
  if (activity.host_role === 'creator_assigns_host' && activity.host_id !== creatorId) {
    const hostMember = await ActivityMember.findOne({
      where: { activity_id: id, user_id: activity.host_id, role: 'host' }
    })
    if (!hostMember || hostMember.status !== 'confirmed') {
      throw new AppError('Cannot publish: The assigned host has not accepted your invitation yet.', 400, 'HOST_CONSENT_REQUIRED')
    }
  }

  await activity.update({
    hosting_reason: hostingReason.trim(),
    location_rationale: locationRationale.trim(),
    status: 'open'
  })

  return activity
}

export const acceptHostingInvite = async (id, hostId) => {
  const activity = await Activity.findByPk(id)
  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  const member = await ActivityMember.findOne({
    where: { activity_id: id, user_id: hostId, role: 'host', status: 'pending' }
  })

  if (!member) {
    throw new AppError('No pending host invitation found.', 404, 'INVITATION_NOT_FOUND')
  }

  member.status = 'confirmed'
  await member.save()

  return { activity, member }
}

export const declineHostingInvite = async (id, hostId) => {
  const activity = await Activity.findByPk(id)
  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  const member = await ActivityMember.findOne({
    where: { activity_id: id, user_id: hostId, role: 'host', status: 'pending' }
  })

  if (!member) {
    throw new AppError('No pending host invitation found.', 404, 'INVITATION_NOT_FOUND')
  }

  // Delete membership
  await member.destroy()

  // Reset activity to creator self-hosted
  activity.host_id = activity.creator_id
  activity.host_role = 'creator_is_host'
  await activity.save()

  // Reset creator membership role to host
  const creatorMember = await ActivityMember.findOne({
    where: { activity_id: id, user_id: activity.creator_id }
  })
  if (creatorMember) {
    creatorMember.role = 'host'
    await creatorMember.save()
  }

  return activity
}
