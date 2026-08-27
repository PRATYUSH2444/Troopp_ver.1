import * as tripRoomRepo from './trip-room.repository.js'
import Activity from '../../models/Activity.js'
import ActivityMember from '../../models/ActivityMember.js'
import TripRule from '../../models/TripRule.js'
import TripWelcomeMessage from '../../models/TripWelcomeMessage.js'
import MemberMute from '../../models/MemberMute.js'
import User from '../../models/User.js'
import Profile from '../../models/Profile.js'
import EmergencyContact from '../../models/EmergencyContact.js'
import { AppError } from '../../middleware/errorHandler.middleware.js'
import logger from '../../config/logger.js'
import { Sequelize, Op } from 'sequelize'

export { tripRoomRepo }

// 1. MESSAGES SERVICE
export const getMessages = async (roomId, options = {}) => {
  return await tripRoomRepo.getMessagesPaginated(roomId, options)
}

export const searchMessages = async (roomId, query, requestingUserId) => {
  return await tripRoomRepo.searchMessages(roomId, query, requestingUserId)
}

export const getMediaGallery = async (roomId, mediaType, requestingUserId) => {
  return await tripRoomRepo.getMediaGallery(roomId, mediaType, requestingUserId)
}

export const getStarredMessages = async (roomId, userId) => {
  return await tripRoomRepo.getStarredMessages(roomId, userId)
}

export const forwardMessage = async (messageId, targetRoomId, userId) => {
  return await tripRoomRepo.forwardMessage(messageId, targetRoomId, userId)
}

export const updateRoomSettings = async (roomId, settings, userId) => {
  const activity = await Activity.findByPk(roomId)
  if (!activity || (activity.creator_id !== userId && activity.host_id !== userId)) {
    throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
  }
  return await tripRoomRepo.updateRoomSettings(roomId, settings)
}

export const muteRoomNotifications = async (roomId, userId, duration) => {
  return await tripRoomRepo.muteRoomNotifications(roomId, userId, duration)
}

// 2. EXPENSES & LEDGER SERVICE
import { calculateSplit, computeTripLedger } from './ledger.service.js'

export const createExpense = async (activityId, payerId, amount, description, splitType = 'equal', options = {}) => {
  // Fetch all confirmed members
  const members = await ActivityMember.findAll({
    where: { activity_id: activityId, status: 'confirmed' }
  })

  if (members.length === 0) {
    throw new AppError('No confirmed members found for this trip.', 400, 'NO_MEMBERS')
  }

  const customShares = options.customSplits || options.customShares || []
  const percentages = options.percentages || []
  const payersList = options.payers || []

  // If multi-payer, validate total paid matches expense amount
  if (Array.isArray(payersList) && payersList.length > 0) {
    const totalPaid = payersList.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    if (Math.abs(totalPaid - parseFloat(amount)) > 0.1) {
      throw new AppError(
        `Total paid by all payers (₹${totalPaid}) must match expense amount (₹${amount}).`,
        400,
        'INVALID_PAYER_SUM'
      )
    }
  }

  const splitsList = calculateSplit(amount, splitType, members, {
    customShares,
    percentages
  })

  return await tripRoomRepo.createExpenseWithSplits(
    activityId,
    payerId,
    amount,
    description,
    splitsList,
    payersList
  )
}

export const getTripLedger = async (activityId) => {
  return await computeTripLedger(activityId)
}

export const deleteExpense = async (expenseId, userId) => {
  return await tripRoomRepo.deleteExpense(expenseId)
}

// 3. POLLS SERVICE
export const createPoll = async (activityId, creatorId, question, options) => {
  if (!options || options.length < 2 || options.length > 4) {
    throw new AppError('Polls must have between 2 and 4 options.', 400, 'INVALID_OPTIONS_COUNT')
  }
  return await tripRoomRepo.createPoll(activityId, creatorId, question, options)
}

export const closePoll = async (activityId, pollId, hostId) => {
  const activity = await Activity.findByPk(activityId)
  if (!activity || activity.creator_id !== hostId) {
    throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
  }
  return await tripRoomRepo.closePoll(pollId)
}

// 4. HOST CONTROLS
export const muteMember = async (activityId, userId, durationHours, hostId) => {
  const activity = await Activity.findByPk(activityId)
  if (!activity || activity.creator_id !== hostId) {
    throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
  }

  const muteExpiry = new Date(Date.now() + durationHours * 60 * 60 * 1000)

  // Destroy existing mutes
  await MemberMute.destroy({ where: { activity_id: activityId, user_id: userId } })

  return await MemberMute.create({
    activity_id: activityId,
    user_id: userId,
    muted_by: hostId,
    muted_until: muteExpiry
  })
}

export const removeMember = async (activityId, userId, hostId) => {
  const activity = await Activity.findByPk(activityId)
  if (!activity || activity.creator_id !== hostId) {
    throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
  }

  const member = await ActivityMember.findOne({ where: { activity_id: activityId, user_id: userId } })
  if (!member || member.status !== 'confirmed') {
    throw new AppError('Member is not part of this activity.', 400, 'MEMBER_NOT_CONFIRMED')
  }

  member.status = 'withdrawn'
  await member.save()

  // Reduce count
  activity.current_members = Math.max(1, activity.current_members - 1)
  if (activity.status === 'full' && activity.current_members < activity.max_group_size) {
    activity.status = 'open'
  }
  await activity.save()

  // Promote waitlist position 1
  const promoted = await ActivityMember.findOne({
    where: { activity_id: activityId, status: 'waitlisted', position: 1 }
  })

  if (promoted) {
    promoted.status = 'confirmed'
    promoted.position = 0
    await promoted.save()

    activity.current_members += 1
    if (activity.current_members === activity.max_group_size) {
      activity.status = 'full'
    }
    await activity.save()

    // Decrement position queue
    await ActivityMember.update(
      { position: Sequelize.literal('position - 1') },
      { where: { activity_id: activityId, status: 'waitlisted', position: { [Op.gt]: 1 } } }
    )
  }

  return { member, promoted }
}

export const toggleChatEnabled = async (activityId, hostId, chatEnabled) => {
  const activity = await Activity.findByPk(activityId)
  if (!activity || activity.creator_id !== hostId) {
    throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
  }

  const rules = await TripRule.findOne({ where: { activity_id: activityId } })
  if (rules) {
    rules.chat_before_full = chatEnabled
    await rules.save()
  }
  return rules
}

export const pinTripMessage = async (activityId, messageId, hostId, isPinned) => {
  const activity = await Activity.findByPk(activityId)
  if (!activity || activity.creator_id !== hostId) {
    throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
  }
  return await tripRoomRepo.pinMessage(messageId, isPinned)
}

export const deleteTripMessage = async (activityId, messageId, hostId) => {
  const activity = await Activity.findByPk(activityId)
  if (!activity || activity.creator_id !== hostId) {
    throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
  }
  return await tripRoomRepo.softDeleteMessage(messageId)
}

export const markTripStarted = async (activityId, hostId) => {
  const activity = await Activity.findByPk(activityId, {
    include: [
      {
        model: ActivityMember,
        as: 'ActivityMembers',
        where: { status: 'confirmed' },
        include: [
          {
            model: User,
            as: 'User',
            include: [{ model: EmergencyContact, as: 'EmergencyContacts' }]
          }
        ]
      }
    ]
  })

  if (!activity || activity.creator_id !== hostId) {
    throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
  }

  activity.status = 'completed' // Mock started state
  await activity.save()

  // Send Twilio notifications to emergency contacts
  const hostProfile = await Profile.findOne({ where: { user_id: hostId } })
  const hostName = hostProfile?.name || 'Host'

  activity.Members.forEach((member) => {
    const u = member.User
    if (!u) return
    const uContacts = u.EmergencyContacts || []
    uContacts.forEach((contact) => {
      logger.info(`[SMS OUTBOUND] Notifying emergency contact: Contact ${contact.name} (${contact.phone}): Your contact has started their trip ${activity.title} with ${activity.current_members} people.`)
    })
  })

  return activity
}

export const markTripEnded = async (activityId, hostId) => {
  const activity = await Activity.findByPk(activityId)
  if (!activity || activity.creator_id !== hostId) {
    throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
  }

  activity.status = 'completed'
  await activity.save()
  return activity
}

export const lockUnlockTrip = async (activityId, hostId, isLocked) => {
  const activity = await Activity.findByPk(activityId)
  if (!activity || activity.creator_id !== hostId) {
    throw new AppError('Access denied: Host credentials required.', 403, 'NOT_HOST')
  }
  activity.visibility = isLocked ? 'followers_only' : 'open'
  await activity.save()
  return activity
}

export const getOnboarding = async (activityId, userId) => {
  const activity = await Activity.findByPk(activityId)
  const isHost = activity && (activity.creator_id === userId || activity.host_id === userId)
  const status = await tripRoomRepo.getOnboardingStatus(activityId, userId)
  const rules = await TripRule.findOne({ where: { activity_id: activityId } })
  const welcome = await TripWelcomeMessage.findOne({ where: { activity_id: activityId } })

  return {
    onboardingCompleted: isHost ? true : (status ? status.onboarding_completed : false),
    rules: rules || {},
    welcomeMessage: welcome ? welcome.message_text : 'Welcome to the trip!'
  }
}

export const completeOnboarding = async (activityId, userId) => {
  return await tripRoomRepo.completeOnboarding(activityId, userId)
}

export const getHealthMetrics = async (activityId) => {
  return await tripRoomRepo.getHealthMetrics(activityId)
}
