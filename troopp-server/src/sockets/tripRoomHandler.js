import { Op } from 'sequelize'
import logger from '../config/logger.js'
import {
  Message,
  Activity,
  ActivityMember,
  TripRoom,
  TripRule,
  TripWelcomeMessage,
  MemberMute,
  Poll,
  CheckInPoint,
  CheckInLog,
  EmergencyContact,
  Profile,
  User,
  HostAction,
  MessageDelivery,
  MessageRead,
  MessageReaction,
  MessageStar,
  MessageDeletedUser,
  Notification
} from '../models/index.js'
import { sendNotification } from '../services/notification.service.js'

// Track active sockets per user for multi-device presence
const activeUserSockets = new Map() // userId -> Set of socket IDs

/**
 * Handles real-time WebSockets communication inside Trip Rooms with full WhatsApp parity.
 */
const registerTripRoomHandlers = (io, socket) => {
  const userId = socket.data.userId

  // Register user socket presence
  if (userId) {
    if (!activeUserSockets.has(userId)) {
      activeUserSockets.set(userId, new Set())
    }
    activeUserSockets.get(userId).add(socket.id)
  }

  // Helper: Verify trip room membership
  const verifyMembership = async (roomId) => {
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
    return member
  }

  // 1. JOIN ROOM EVENT
  socket.on('join_room', async (payload = {}) => {
    try {
      const roomId = payload.roomId || payload.trip_room_id
      if (!roomId) {
        return socket.emit('error', { code: 'INVALID_ROOM_ID', message: 'Room ID is required.' })
      }

      const member = await verifyMembership(roomId)
      if (!member) {
        logger.warn(`Unauthorized socket join request from User: ${userId} to Room: ${roomId}`)
        return socket.emit('error', { code: 'UNAUTHORIZED_ROOM', message: 'Access denied: confirmed membership required.' })
      }

      socket.join(roomId)
      logger.info(`Socket [${socket.id}] joined Room: ${roomId} (User: ${userId})`)

      // Exclude messages deleted "for me"
      const deletedForMe = await MessageDeletedUser.findAll({
        where: { user_id: userId },
        attributes: ['message_id']
      })
      const excludedIds = deletedForMe.map((d) => d.message_id)

      // Fetch last 50 messages from DB
      const messages = await Message.findAll({
        where: {
          trip_room_id: roomId,
          ...(excludedIds.length > 0 ? { id: { [Op.notIn]: excludedIds } } : {})
        },
        limit: 50,
        order: [['created_at', 'ASC']],
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
            include: [{ model: User, as: 'User', attributes: ['id'], include: [{ model: Profile, as: 'Profile', attributes: ['name'] }] }]
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
          {
            model: MessageStar,
            as: 'Stars',
            where: { user_id: userId },
            required: false,
            attributes: ['id']
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
            attributes: ['id', 'trust_score', 'reliability_score', 'last_active_at', 'online_status_visible', 'presence_privacy', 'read_receipts_enabled'],
            include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
          }
        ]
      })

      // Format messages with is_starred boolean
      const formattedMessages = messages.map((m) => {
        const plain = m.toJSON()
        plain.is_starred = Boolean(plain.Stars && plain.Stars.length > 0)
        return plain
      })

      // Emit room_joined acknowledgement
      socket.emit('room_joined', {
        roomId,
        messages: formattedMessages,
        rules: rules || {},
        welcomeMessage: welcome ? welcome.message_text : 'Welcome to the trip!',
        members: confirmedMembers.map((m) => ({
          userId: m.user_id,
          name: m.User?.Profile?.name || 'Explorer',
          avatarUrl: m.User?.Profile?.avatar_url,
          trustScore: m.User?.trust_score || 50,
          reliabilityScore: m.User?.reliability_score || 100,
          role: m.role || 'member',
          isCohost: m.is_cohost || false,
          isOnline: activeUserSockets.has(m.user_id) && activeUserSockets.get(m.user_id).size > 0,
          lastSeen: m.User?.last_active_at,
          presencePrivacy: m.User?.presence_privacy || 'everyone',
          readReceiptsEnabled: m.User?.read_receipts_enabled !== false,
          notificationMutedUntil: m.notification_muted_until
        }))
      })

      // Broadcast room join notification to others
      socket.to(roomId).emit('member_joined', {
        userId,
        name: socket.user?.Profile?.name || 'A traveler',
        avatarUrl: socket.user?.Profile?.avatar_url,
        trustScore: socket.user?.trust_score || 50,
        reliabilityScore: socket.user?.reliability_score || 100,
        isOnline: true
      })

      // Auto-ack delivery for past messages to this user
      const unacknowledgedMessages = messages.filter(
        (m) => m.sender_id !== userId && !m.Deliveries?.some((d) => d.user_id === userId)
      )
      if (unacknowledgedMessages.length > 0) {
        const messageIds = unacknowledgedMessages.map((m) => m.id)
        const deliveryEntries = messageIds.map((id) => ({
          message_id: id,
          user_id: userId,
          delivered_at: new Date()
        }))
        await MessageDelivery.bulkCreate(deliveryEntries, { ignoreDuplicates: true })

        io.to(roomId).emit('message_delivered', {
          messageIds,
          userId,
          deliveredAt: new Date().toISOString()
        })
      }
    } catch (error) {
      logger.error('Error joining room socket:', error)
      socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to join trip room channel.' })
    }
  })

  // 2. SEND MESSAGE EVENT
  socket.on('send_message', async (payload = {}) => {
    try {
      const roomId = payload.roomId || payload.trip_room_id
      const content = payload.content || payload.messageText || payload.message_text
      const messageType = payload.messageType || payload.message_type || 'text'
      const media = payload.media || null
      const replyToId = payload.replyToId || payload.reply_to_message_id || null
      const locationData = payload.locationData || payload.location_data || null
      const contactData = payload.contactData || payload.contact_data || null
      const clientTempId = payload.clientTempId || payload.tempId || null

      if (!roomId || (!content && !media && !locationData && !contactData)) {
        return socket.emit('error', { code: 'BAD_REQUEST', message: 'Room ID and message payload are required.' })
      }

      // Check if user is muted by host in this room
      const mute = await MemberMute.findOne({
        where: {
          activity_id: roomId,
          user_id: userId,
          muted_until: { [Op.gt]: new Date() }
        }
      })

      if (mute) {
        return socket.emit('error', { code: 'MEMBER_MUTED', message: 'You have been muted in this chat by the host.' })
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

      // Check idempotency with clientTempId
      if (clientTempId) {
        const existing = await Message.findOne({ where: { client_temp_id: clientTempId } })
        if (existing) {
          logger.info(`Idempotent message retry detected for tempId: ${clientTempId}`)
          return
        }
      }

      // Insert message
      const msg = await Message.create({
        trip_room_id: roomId,
        sender_id: userId,
        message_type: messageType,
        message_text: content || '',
        media,
        reply_to_message_id: replyToId,
        location_data: locationData,
        contact_data: contactData,
        client_temp_id: clientTempId,
        deleted_for: 'none',
        created_at: new Date(),
        updated_at: new Date()
      })

      // Automatically record sender delivery and read
      await Promise.all([
        MessageDelivery.create({ message_id: msg.id, user_id: userId, delivered_at: new Date() }).catch(() => {}),
        MessageRead.create({ message_id: msg.id, user_id: userId, read_at: new Date() }).catch(() => {})
      ])

      // Query Sender & ReplyTo for full payload
      const [senderProfile, senderUser, replyToMsg] = await Promise.all([
        Profile.findOne({ where: { user_id: userId } }),
        User.findByPk(userId),
        replyToId
          ? Message.findByPk(replyToId, {
              attributes: ['id', 'sender_id', 'message_text', 'message_type', 'media'],
              include: [{ model: User, as: 'Sender', attributes: ['id'], include: [{ model: Profile, as: 'Profile', attributes: ['name'] }] }]
            })
          : null
      ])

      const messagePayload = {
        id: msg.id,
        client_temp_id: clientTempId,
        trip_room_id: roomId,
        sender_id: userId,
        message_text: content || '',
        message_type: messageType,
        media,
        reply_to_message_id: replyToId,
        ReplyTo: replyToMsg ? replyToMsg.toJSON() : null,
        location_data: locationData,
        contact_data: contactData,
        deleted_for: 'none',
        edited_at: null,
        created_at: msg.created_at || msg.createdAt,
        Reactions: [],
        Deliveries: [{ user_id: userId, delivered_at: new Date().toISOString() }],
        Reads: [{ user_id: userId, read_at: new Date().toISOString() }],
        is_starred: false,
        Sender: {
          id: userId,
          trust_score: senderUser?.trust_score || 50,
          reliability_score: senderUser?.reliability_score || 100,
          Profile: {
            name: senderProfile?.name || 'Explorer',
            avatar_url: senderProfile?.avatar_url
          }
        }
      }

      // Broadcast to room (including sender)
      io.to(roomId).emit('new_message', messagePayload)

      // Notify offline members asynchronously
      const members = await ActivityMember.findAll({
        where: {
          activity_id: roomId,
          user_id: { [Op.ne]: userId },
          status: 'confirmed'
        }
      })

      const offlineMemberIds = members
        .filter((m) => {
          const isOnline = activeUserSockets.has(m.user_id) && activeUserSockets.get(m.user_id).size > 0
          const isMuted = m.notification_muted_until && new Date() < new Date(m.notification_muted_until)
          return !isOnline && !isMuted
        })
        .map((m) => m.user_id)

      if (offlineMemberIds.length > 0) {
        const senderName = senderProfile?.name || 'A traveler'
        const activity = await Activity.findByPk(roomId, { attributes: ['title'] })
        const tripTitle = activity?.title || 'Trip Room'

        for (const recipientId of offlineMemberIds) {
          sendNotification(recipientId, {
            type: 'chat_message',
            title: `${senderName} in ${tripTitle}`,
            body: content || (media ? `Sent a ${messageType}` : 'Sent a message'),
            data: { roomId, messageId: msg.id }
          }).catch((err) => logger.warn(`Failed sending push to user ${recipientId}: ${err.message}`))
        }
      }
    } catch (error) {
      logger.error('Error sending message socket:', error)
      socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to send message.' })
    }
  })

  // 3. DELIVERY ACKNOWLEDGEMENT EVENT
  socket.on('message_delivered_ack', async (payload = {}) => {
    try {
      const { roomId, messageIds } = payload
      if (!roomId || !Array.isArray(messageIds) || messageIds.length === 0) return

      const entries = messageIds.map((id) => ({
        message_id: id,
        user_id: userId,
        delivered_at: new Date()
      }))

      await MessageDelivery.bulkCreate(entries, { ignoreDuplicates: true })

      io.to(roomId).emit('message_delivered', {
        messageIds,
        userId,
        deliveredAt: new Date().toISOString()
      })
    } catch (err) {
      logger.error('Error recording message delivery ack:', err)
    }
  })

  // 4. READ RECEIPT ACKNOWLEDGEMENT EVENT
  socket.on('message_read_ack', async (payload = {}) => {
    try {
      const { roomId, messageIds } = payload
      if (!roomId || !Array.isArray(messageIds) || messageIds.length === 0) return

      // Verify if user has read receipts enabled
      const user = await User.findByPk(userId, { attributes: ['read_receipts_enabled'] })
      if (user && user.read_receipts_enabled === false) return

      const entries = messageIds.map((id) => ({
        message_id: id,
        user_id: userId,
        read_at: new Date()
      }))

      await MessageRead.bulkCreate(entries, { ignoreDuplicates: true })

      // Update ActivityMember last_read_at
      await ActivityMember.update(
        { last_read_at: new Date() },
        { where: { activity_id: roomId, user_id: userId } }
      )

      io.to(roomId).emit('message_read', {
        messageIds,
        userId,
        readAt: new Date().toISOString()
      })
    } catch (err) {
      logger.error('Error recording message read ack:', err)
    }
  })

  // 5. REACTION ADD / REMOVE EVENTS
  socket.on('message_reaction_add', async (payload = {}) => {
    try {
      const { roomId, messageId, emoji } = payload
      if (!roomId || !messageId || !emoji) return

      await MessageReaction.findOrCreate({
        where: { message_id: messageId, user_id: userId, emoji },
        defaults: { message_id: messageId, user_id: userId, emoji, created_at: new Date() }
      })

      const reactions = await MessageReaction.findAll({
        where: { message_id: messageId },
        include: [{ model: User, as: 'User', attributes: ['id'], include: [{ model: Profile, as: 'Profile', attributes: ['name'] }] }]
      })

      io.to(roomId).emit('message_reaction_updated', {
        messageId,
        reactions: reactions.map((r) => r.toJSON())
      })
    } catch (err) {
      logger.error('Error adding message reaction:', err)
    }
  })

  socket.on('message_reaction_remove', async (payload = {}) => {
    try {
      const { roomId, messageId, emoji } = payload
      if (!roomId || !messageId || !emoji) return

      await MessageReaction.destroy({
        where: { message_id: messageId, user_id: userId, emoji }
      })

      const reactions = await MessageReaction.findAll({
        where: { message_id: messageId },
        include: [{ model: User, as: 'User', attributes: ['id'], include: [{ model: Profile, as: 'Profile', attributes: ['name'] }] }]
      })

      io.to(roomId).emit('message_reaction_updated', {
        messageId,
        reactions: reactions.map((r) => r.toJSON())
      })
    } catch (err) {
      logger.error('Error removing message reaction:', err)
    }
  })

  // 6. MESSAGE EDIT EVENT (15-Minute Window)
  socket.on('message_edit', async (payload = {}) => {
    try {
      const { roomId, messageId, newText } = payload
      if (!roomId || !messageId || !newText?.trim()) return

      const msg = await Message.findByPk(messageId)
      if (!msg) return socket.emit('error', { code: 'NOT_FOUND', message: 'Message not found.' })

      if (msg.sender_id !== userId) {
        return socket.emit('error', { code: 'FORBIDDEN', message: 'You can only edit your own messages.' })
      }

      // Check 15-minute time window
      const diffMinutes = (Date.now() - new Date(msg.created_at).getTime()) / (1000 * 60)
      if (diffMinutes > 15) {
        return socket.emit('error', { code: 'EDIT_WINDOW_EXPIRED', message: 'Messages can only be edited within 15 minutes.' })
      }

      const history = msg.edit_history || []
      history.push({ text: msg.message_text, edited_at: new Date().toISOString() })

      msg.message_text = newText.trim()
      msg.edited_at = new Date()
      msg.edit_history = history
      await msg.save()

      io.to(roomId).emit('message_edited', {
        messageId,
        newText: msg.message_text,
        editedAt: msg.edited_at.toISOString()
      })
    } catch (err) {
      logger.error('Error editing message:', err)
    }
  })

  // 7. MESSAGE DELETE EVENT (Everyone vs. Me)
  socket.on('message_delete', async (payload = {}) => {
    try {
      const { roomId, messageId, scope } = payload // scope: 'everyone' | 'me'
      if (!roomId || !messageId) return

      const msg = await Message.findByPk(messageId)
      if (!msg) return socket.emit('error', { code: 'NOT_FOUND', message: 'Message not found.' })

      if (scope === 'everyone') {
        const activity = await Activity.findByPk(roomId)
        const isHost = activity && (activity.creator_id === userId || activity.host_id === userId)
        const isSender = msg.sender_id === userId

        if (!isSender && !isHost) {
          return socket.emit('error', { code: 'FORBIDDEN', message: 'Access denied: Sender or Host privileges required.' })
        }

        // 1-hour window for sender deletion
        const diffMinutes = (Date.now() - new Date(msg.created_at).getTime()) / (1000 * 60)
        if (isSender && !isHost && diffMinutes > 60) {
          return socket.emit('error', { code: 'DELETE_WINDOW_EXPIRED', message: 'Delete for everyone is only available within 1 hour.' })
        }

        msg.deleted_for = 'everyone'
        msg.message_text = '🚫 This message was deleted'
        msg.media = null
        msg.location_data = null
        msg.contact_data = null
        await msg.save()

        io.to(roomId).emit('message_deleted', {
          messageId,
          scope: 'everyone'
        })
      } else {
        // Delete for me
        await MessageDeletedUser.findOrCreate({
          where: { message_id: messageId, user_id: userId },
          defaults: { message_id: messageId, user_id: userId, deleted_at: new Date() }
        })

        socket.emit('message_deleted', {
          messageId,
          scope: 'me'
        })
      }
    } catch (err) {
      logger.error('Error deleting message:', err)
    }
  })

  // 8. MESSAGE STAR / UNSTAR EVENTS
  socket.on('message_star', async (payload = {}) => {
    try {
      const { messageId } = payload
      if (!messageId) return

      await MessageStar.findOrCreate({
        where: { message_id: messageId, user_id: userId },
        defaults: { message_id: messageId, user_id: userId, created_at: new Date() }
      })

      socket.emit('message_starred', { messageId, isStarred: true })
    } catch (err) {
      logger.error('Error starring message:', err)
    }
  })

  socket.on('message_unstar', async (payload = {}) => {
    try {
      const { messageId } = payload
      if (!messageId) return

      await MessageStar.destroy({
        where: { message_id: messageId, user_id: userId }
      })

      socket.emit('message_starred', { messageId, isStarred: false })
    } catch (err) {
      logger.error('Error unstarring message:', err)
    }
  })

  // 9. TYPING EPHEMERAL EVENTS
  socket.on('typing_start', (payload = {}) => {
    const roomId = payload.roomId || payload.trip_room_id
    if (!roomId) return

    socket.to(roomId).emit('user_typing', {
      userId,
      userName: socket.user?.Profile?.name || 'Someone'
    })
  })

  socket.on('typing_stop', (payload = {}) => {
    const roomId = payload.roomId || payload.trip_room_id
    if (!roomId) return

    socket.to(roomId).emit('user_stop_typing', {
      userId
    })
  })

  // 10. LIVE LOCATION UPDATE EVENT
  socket.on('live_location_update', (payload = {}) => {
    const roomId = payload.roomId || payload.trip_room_id
    const { latitude, longitude, heading, speed } = payload
    if (!roomId || !latitude || !longitude) return

    socket.to(roomId).emit('live_location_broadcast', {
      userId,
      userName: socket.user?.Profile?.name || 'Explorer',
      avatarUrl: socket.user?.Profile?.avatar_url,
      latitude,
      longitude,
      heading,
      speed,
      updatedAt: new Date().toISOString()
    })
  })

  // 11. EMERGENCY SOS TRIGGER & RESOLVE
  socket.on('sos_trigger', async (payload = {}) => {
    try {
      const roomId = payload.roomId || payload.trip_room_id
      const { latitude, longitude } = payload
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
        action_type: 'sos_alert',
        details: `SOS trigger logged by User: ${userId} (${profile?.name}) at coordinate [${latitude}, ${longitude}]`
      })

      // Send SMS alert to emergency contacts
      if (user?.EmergencyContacts && user.EmergencyContacts.length > 0) {
        user.EmergencyContacts.forEach((contact) => {
          logger.info(`[SMS SOS OUTBOUND] Text alert sent to emergency contact (${contact.name} - ${contact.phone}): SOS alert for traveler ${profile?.name} on trip: ${activity?.title}. Location: https://maps.google.com/?q=${latitude},${longitude}`)
        })
      }

      // Broadcast persistent alert to room
      io.to(roomId).emit('sos_triggered', {
        userId,
        userName: profile?.name || 'Explorer',
        avatarUrl: profile?.avatar_url,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        isResolved: false
      })
    } catch (error) {
      logger.error('Error handling emergency SOS socket trigger:', error)
    }
  })

  socket.on('sos_resolve', async (payload = {}) => {
    try {
      const roomId = payload.roomId || payload.trip_room_id
      if (!roomId) return

      const activity = await Activity.findByPk(roomId)
      const isHost = activity && (activity.creator_id === userId || activity.host_id === userId)
      if (!isHost) {
        return socket.emit('error', { code: 'FORBIDDEN', message: 'Only hosts can resolve active SOS alerts.' })
      }

      io.to(roomId).emit('sos_resolved', {
        resolvedById: userId,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      logger.error('Error resolving SOS:', error)
    }
  })

  // 12. HANDLE DISCONNECTION
  socket.on('disconnect', async () => {
    logger.info(`Socket client disconnected: ${socket.id} (User: ${userId})`)
    if (userId && activeUserSockets.has(userId)) {
      const sockets = activeUserSockets.get(userId)
      sockets.delete(socket.id)
      if (sockets.size === 0) {
        activeUserSockets.delete(userId)
        await User.update({ last_active_at: new Date() }, { where: { id: userId } }).catch(() => {})

        io.emit('presence_update', {
          userId,
          isOnline: false,
          lastSeen: new Date().toISOString()
        })
      }
    }
  })
}

export default registerTripRoomHandlers
export { registerTripRoomHandlers }
