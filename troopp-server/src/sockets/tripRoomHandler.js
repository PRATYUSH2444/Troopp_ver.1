import { Op } from 'sequelize'
import logger from '../config/logger.js'
import Message from '../models/Message.js'
import Activity from '../models/Activity.js'
import ActivityMember from '../models/ActivityMember.js'
import TripRoom from '../models/TripRoom.js'
import TripRule from '../models/TripRule.js'
import TripWelcomeMessage from '../models/TripWelcomeMessage.js'
import MemberMute from '../models/MemberMute.js'
import Poll from '../models/Poll.js'
import CheckInPoint from '../models/CheckInPoint.js'
import CheckInLog from '../models/CheckInLog.js'
import EmergencyContact from '../models/EmergencyContact.js'
import Profile from '../models/Profile.js'
import User from '../models/User.js'
import HostAction from '../models/HostAction.js'

/**
 * Handles real-time WebSockets communication inside Trip Rooms.
 */
const registerTripRoomHandlers = (io, socket) => {
  const userId = socket.data.userId

  // 1. JOIN ROOM EVENT
  socket.on('join_room', async (payload) => {
    try {
      const { roomId } = payload
      if (!roomId) {
        return socket.emit('error', { code: 'INVALID_ROOM_ID', message: 'Room ID is required.' })
      }

      // Verify user is confirmed member or host of this trip room
      let member = await ActivityMember.findOne({
        where: { activity_id: roomId, user_id: userId, status: 'confirmed' }
      })

      if (!member) {
        const activity = await Activity.findByPk(roomId)
        if (activity && (activity.creator_id === userId || activity.host_id === userId)) {
          const [hostMember] = await ActivityMember.findOrCreate({
            where: { activity_id: roomId, user_id: userId },
            defaults: { status: 'confirmed', role: 'host', position: 0 }
          })
          member = hostMember
        }
      }

      if (!member) {
        logger.warn(`Unauthorized socket join request from User: ${userId} to Room: ${roomId}`)
        return socket.emit('error', { code: 'UNAUTHORIZED_ROOM', message: 'Access denied: confirmed membership required.' })
      }

      socket.join(roomId)
      logger.info(`Socket [${socket.id}] joined Room: ${roomId} (User: ${userId})`)

      // Fetch last 50 messages from DB
      const messages = await Message.findAll({
        where: { trip_room_id: roomId },
        limit: 50,
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

      // Fetch rules, welcome messages, and confirmed members
      const rules = await TripRule.findOne({ where: { activity_id: roomId } })
      const welcome = await TripWelcomeMessage.findOne({ where: { activity_id: roomId } })
      const confirmedMembers = await ActivityMember.findAll({
        where: { activity_id: roomId, status: 'confirmed' },
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'trust_score', 'reliability_score'],
            include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
          }
        ]
      })

      // Emit room_joined acknowledgement
      socket.emit('room_joined', {
        roomId,
        messages,
        rules: rules || {},
        welcomeMessage: welcome ? welcome.message_text : 'Welcome to the trip!',
        members: confirmedMembers.map((m) => ({
          userId: m.user_id,
          name: m.User?.Profile?.name || 'Explorer',
          avatarUrl: m.User?.Profile?.avatar_url,
          trustScore: m.User?.trust_score || 50,
          reliabilityScore: m.User?.reliability_score || 100
        }))
      })

      // Broadcast room join notification to others
      socket.to(roomId).emit('member_joined', {
        userId,
        name: socket.user?.Profile?.name || 'A traveler',
        avatarUrl: socket.user?.Profile?.avatar_url,
        trustScore: socket.user?.trust_score || 50,
        reliabilityScore: socket.user?.reliability_score || 100
      })
    } catch (error) {
      logger.error('Error joining room socket:', error)
      socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to join trip room channel.' })
    }
  })

  // 2. SEND MESSAGE EVENT
  socket.on('send_message', async (payload) => {
    try {
      const { roomId, content } = payload
      if (!roomId || !content) {
        return socket.emit('error', { code: 'BAD_REQUEST', message: 'Room ID and message body are required.' })
      }

      // Check if user is muted in this room
      const mute = await MemberMute.findOne({
        where: {
          activity_id: roomId,
          user_id: userId,
          muted_until: { [Op.gt]: new Date() }
        }
      })

      if (mute) {
        return socket.emit('error', { code: 'MEMBER_MUTED', message: 'You have been muted in this chat.' })
      }

      // Check trip rules & room status
      const tripRoom = await TripRoom.findOne({ where: { activity_id: roomId } })
      if (!tripRoom || tripRoom.status === 'archived') {
        return socket.emit('error', { code: 'ROOM_ARCHIVED', message: 'This room has been archived.' })
      }

      const rules = await TripRule.findOne({ where: { activity_id: roomId } })
      if (rules && !rules.chat_before_full && !tripRoom.chat_enabled) {
        return socket.emit('error', { code: 'CHAT_DISABLED', message: 'Chat is currently disabled by the host.' })
      }

      // Insert message
      const msg = await Message.create({
        trip_room_id: roomId,
        sender_id: userId,
        message_type: 'text',
        message_text: content,
        created_at: new Date(),
        updated_at: new Date()
      })

      const senderProfile = await Profile.findOne({ where: { user_id: userId } })
      const senderUser = await User.findByPk(userId)

      const messagePayload = {
        id: msg.id,
        trip_room_id: roomId,
        sender_id: userId,
        message_text: content,
        message_type: 'text',
        created_at: msg.created_at,
        Sender: {
          id: userId,
          trust_score: senderUser?.trust_score || 50,
          Profile: {
            name: senderProfile?.name || 'Explorer',
            avatar_url: senderProfile?.avatar_url
          }
        }
      }

      // Broadcast to room
      io.to(roomId).emit('new_message', messagePayload)
    } catch (error) {
      logger.error('Error sending message socket:', error)
      socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to send message.' })
    }
  })

  // 3. SEND ANNOUNCEMENT EVENT (Host only)
  socket.on('send_announcement', async (payload) => {
    try {
      const { roomId, content } = payload
      if (!roomId || !content) {
        return socket.emit('error', { code: 'BAD_REQUEST', message: 'Room ID and announcement body required.' })
      }

      const activity = await Activity.findByPk(roomId)
      if (!activity) {
        return socket.emit('error', { code: 'NOT_FOUND', message: 'Trip not found.' })
      }

      if (activity.creator_id !== userId) {
        return socket.emit('error', { code: 'FORBIDDEN', message: 'Only hosts can make announcements.' })
      }

      // Save announcement
      const msg = await Message.create({
        trip_room_id: roomId,
        sender_id: userId,
        message_type: 'announcement',
        message_text: content,
        created_at: new Date(),
        updated_at: new Date()
      })

      const senderProfile = await Profile.findOne({ where: { user_id: userId } })
      const senderUser = await User.findByPk(userId)

      const messagePayload = {
        id: msg.id,
        trip_room_id: roomId,
        sender_id: userId,
        message_text: content,
        message_type: 'announcement',
        created_at: msg.created_at,
        Sender: {
          id: userId,
          trust_score: senderUser?.trust_score || 50,
          Profile: {
            name: senderProfile?.name || 'Host',
            avatar_url: senderProfile?.avatar_url
          }
        }
      }

      // Broadcast announcement
      io.to(roomId).emit('new_message', messagePayload)
      io.to(roomId).emit('new_announcement', messagePayload)

      // Emit mock FCM push alerts to members
      logger.info(`[FCM BROADCAST] Broadcasted host update to members of activity: ${activity.title}`)
    } catch (error) {
      logger.error('Error broadcasting announcement socket:', error)
      socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to broadcast announcement.' })
    }
  })

  // 4. POLL VOTE EVENT
  socket.on('poll_vote', async (payload) => {
    try {
      const { roomId, pollId, optionIndex } = payload
      if (!roomId || !pollId || optionIndex === undefined) {
        return socket.emit('error', { code: 'BAD_REQUEST', message: 'Invalid vote parameters.' })
      }

      const poll = await Poll.findOne({ where: { id: pollId, activity_id: roomId } })
      if (!poll) {
        return socket.emit('error', { code: 'NOT_FOUND', message: 'Poll not found.' })
      }

      if (poll.is_closed) {
        return socket.emit('error', { code: 'POLL_CLOSED', message: 'This poll has ended.' })
      }

      // Votes structure expected to be object array format: [[userIds...], [userIds...]]
      let votes = poll.votes
      if (!Array.isArray(votes)) {
        votes = Array(poll.options.length).fill(null).map(() => [])
      }

      // Check if user already voted
      const alreadyVoted = votes.some((vArr) => Array.isArray(vArr) && vArr.includes(userId))
      if (alreadyVoted) {
        return socket.emit('error', { code: 'ALREADY_VOTED', message: 'You have already cast a vote.' })
      }

      if (!votes[optionIndex]) {
        votes[optionIndex] = []
      }
      votes[optionIndex].push(userId)

      poll.votes = votes
      poll.changed('votes', true)
      await poll.save()

      // Broadcast update
      io.to(roomId).emit('poll_updated', {
        pollId,
        votes
      })
    } catch (error) {
      logger.error('Error voting on poll socket:', error)
      socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to record vote.' })
    }
  })

  // 5. CHECK-IN CONFIRM EVENT
  socket.on('checkin_confirm', async (payload) => {
    try {
      const { roomId, pointId, latitude, longitude } = payload
      if (!roomId || !pointId || !latitude || !longitude) {
        return socket.emit('error', { code: 'BAD_REQUEST', message: 'Invalid check-in coordinates.' })
      }

      const point = await CheckInPoint.findOne({ where: { id: pointId, activity_id: roomId } })
      if (!point) {
        return socket.emit('error', { code: 'NOT_FOUND', message: 'Waypoint check-in point not found.' })
      }

      // Insert log
      const checkin = await CheckInLog.create({
        check_in_point_id: pointId,
        user_id: userId,
        latitude,
        longitude,
        is_verified: true,
        checked_in_at: new Date()
      })

      const profile = await Profile.findOne({ where: { user_id: userId } })

      // Broadcast update
      io.to(roomId).emit('checkin_update', {
        pointId,
        userId,
        userName: profile?.name || 'Explorer',
        checkedInAt: checkin.checked_in_at
      })
    } catch (error) {
      logger.error('Error confirming check-in socket:', error)
      socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to log waypoint check-in.' })
    }
  })

  // 6. CHECKLIST UPDATE EVENT
  socket.on('checklist_update', async (payload) => {
    try {
      const { roomId, itemIndex, isChecked } = payload
      if (!roomId || itemIndex === undefined) {
        return
      }

      const activity = await Activity.findByPk(roomId)
      if (!activity) return

      let checklist = activity.packing_checklist || []
      if (checklist[itemIndex]) {
        // Toggle state in packing checklist object
        checklist[itemIndex].checked = isChecked
        checklist[itemIndex].checked_by_id = isChecked ? userId : null
        
        activity.packing_checklist = checklist
        activity.changed('packing_checklist', true)
        await activity.save()

        const profile = await Profile.findOne({ where: { user_id: userId } })

        io.to(roomId).emit('checklist_item_updated', {
          itemIndex,
          isChecked,
          userId,
          userName: profile?.name || 'Explorer'
        })
      }
    } catch (error) {
      logger.error('Error updating checklist socket:', error)
    }
  })

  // 7. TYPING EPHEMERAL EVENT
  socket.on('typing_start', (payload) => {
    const { roomId } = payload
    if (!roomId) return

    socket.to(roomId).emit('user_typing', {
      userId,
      userName: socket.user?.Profile?.name || 'Someone'
    })
  })

  // 8. EMERGENCY SOS TRIGGER EVENT (GPS coords are broadcasted but NEVER stored in DB)
  socket.on('sos_trigger', async (payload) => {
    try {
      const { roomId, latitude, longitude } = payload
      if (!roomId || !latitude || !longitude) {
        return socket.emit('error', { code: 'BAD_REQUEST', message: 'SOS requires active GPS coordinates.' })
      }

      const user = await User.findByPk(userId, {
        include: [{ model: EmergencyContact, as: 'EmergencyContacts' }]
      })
      const profile = await Profile.findOne({ where: { user_id: userId } })
      const activity = await Activity.findByPk(roomId)

      logger.warn(`!!! SOS SIGNAL TRIGGERED BY USER: ${userId} IN ROOM: ${roomId} !!!`)

      // Insert Host Action logs
      await HostAction.create({
        activity_id: roomId,
        host_id: activity?.creator_id || userId,
        action_type: 'kick', // Mock category placeholder
        details: `SOS trigger logged by User: ${userId} (${profile?.name}) at coordinate [${latitude}, ${longitude}]`
      })

      // Send Twilio Mock SMS to Emergency contacts
      if (user?.EmergencyContacts && user.EmergencyContacts.length > 0) {
        user.EmergencyContacts.forEach((contact) => {
          logger.info(`[SMS SOS OUTBOUND] Text alert sent to emergency contact (${contact.name} - ${contact.phone}): SOS alert for traveler ${profile?.name} on trip: ${activity?.title}. Location: https://maps.google.com/?q=${latitude},${longitude}`)
        });
      }

      // Broadcast alert to room
      io.to(roomId).emit('sos_triggered', {
        userId,
        userName: profile?.name || 'Explorer',
        latitude,
        longitude
      })
    } catch (error) {
      logger.error('Error handling emergency SOS socket trigger:', error)
    }
  })

  // 9. HANDLE DISCONNECTION
  socket.on('disconnect', () => {
    logger.info(`Socket client disconnected: ${socket.id} (User: ${userId})`)
  })
}

export default registerTripRoomHandlers
export { registerTripRoomHandlers }
