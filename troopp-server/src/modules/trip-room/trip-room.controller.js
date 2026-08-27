import * as tripRoomService from './trip-room.service.js'
import logger from '../../config/logger.js'

/**
 * REST Controllers for Trip Room endpoints.
 */

import { uploadToCloudinary } from '../../config/cloudinary.js'

// 1. CHAT MESSAGES & EXTENSIONS
export const getMessages = async (req, res, next) => {
  try {
    const { limit = 30, before, after, offset = 0 } = req.query
    const result = await tripRoomService.getMessages(req.params.id, {
      limit,
      before,
      after,
      offset,
      requestingUserId: req.user.id
    })
    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const searchMessages = async (req, res, next) => {
  try {
    const { q } = req.query
    const results = await tripRoomService.searchMessages(req.params.id, q, req.user.id)
    res.status(200).json({
      success: true,
      data: results
    })
  } catch (error) {
    next(error)
  }
}

export const getMediaGallery = async (req, res, next) => {
  try {
    const { type = 'all' } = req.query
    const items = await tripRoomService.getMediaGallery(req.params.id, type, req.user.id)
    res.status(200).json({
      success: true,
      data: items
    })
  } catch (error) {
    next(error)
  }
}

export const getStarredMessages = async (req, res, next) => {
  try {
    const stars = await tripRoomService.getStarredMessages(req.params.id, req.user.id)
    res.status(200).json({
      success: true,
      data: stars
    })
  } catch (error) {
    next(error)
  }
}

export const uploadChatMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file attached for upload.' })
    }

    const { mimetype, originalname, size, buffer } = req.file
    let folder = 'trip_room_chat/documents'
    let resource_type = 'auto'

    if (mimetype.startsWith('image/')) {
      folder = 'trip_room_chat/images'
      resource_type = 'image'
    } else if (mimetype.startsWith('video/')) {
      folder = 'trip_room_chat/videos'
      resource_type = 'video'
    } else if (mimetype.startsWith('audio/')) {
      folder = 'trip_room_chat/audio'
      resource_type = 'video' // Cloudinary stores audio under video resource_type
    }

    const uploadResult = await uploadToCloudinary(buffer, { folder, resource_type })

    const mediaPayload = {
      url: uploadResult.secure_url || uploadResult.url,
      mimetype,
      filename: originalname,
      size,
      width: uploadResult.width || null,
      height: uploadResult.height || null,
      duration: uploadResult.duration || null
    }

    res.status(200).json({
      success: true,
      data: mediaPayload
    })
  } catch (error) {
    next(error)
  }
}

export const forwardMessage = async (req, res, next) => {
  try {
    const { targetRoomId } = req.body
    const { msgId } = req.params
    const forwarded = await tripRoomService.forwardMessage(msgId, targetRoomId, req.user.id)

    // Broadcast to target room if socket.io is available
    const io = req.app.get('io')
    if (io && forwarded) {
      io.to(targetRoomId).emit('new_message', forwarded)
    }

    res.status(201).json({
      success: true,
      message: 'Message forwarded successfully.',
      data: forwarded
    })
  } catch (error) {
    next(error)
  }
}

export const updateRoomSettings = async (req, res, next) => {
  try {
    const room = await tripRoomService.updateRoomSettings(req.params.id, req.body, req.user.id)
    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit('room_updated', room)
    }
    res.status(200).json({
      success: true,
      message: 'Room settings updated.',
      data: room
    })
  } catch (error) {
    next(error)
  }
}

export const muteRoomNotifications = async (req, res, next) => {
  try {
    const { duration } = req.body // duration in minutes or 'always'
    const result = await tripRoomService.muteRoomNotifications(req.params.id, req.user.id, duration)
    res.status(200).json({
      success: true,
      message: 'Notification preferences updated.',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

// 2. EXPENSES & LEDGER & SETTLEMENTS
import * as settlementService from './settlement.service.js'
import * as ledgerService from './ledger.service.js'

export const getExpenses = async (req, res, next) => {
  try {
    const expenses = await tripRoomService.tripRoomRepo.getExpensesWithSplits(req.params.id)
    res.status(200).json({
      success: true,
      data: expenses
    })
  } catch (error) {
    next(error)
  }
}

export const getLedger = async (req, res, next) => {
  try {
    const ledger = await ledgerService.computeTripLedger(req.params.id)
    res.status(200).json({
      success: true,
      data: ledger
    })
  } catch (error) {
    next(error)
  }
}

export const createExpense = async (req, res, next) => {
  try {
    const { amount, description, splitType, customSplits, percentages, payers } = req.body
    const expense = await tripRoomService.createExpense(
      req.params.id,
      req.user.id,
      amount,
      description,
      splitType || 'equal',
      { customSplits, percentages, payers }
    )

    // Recompute ledger and broadcast update via sockets
    const io = req.app.get('io')
    if (io) {
      const ledger = await ledgerService.computeTripLedger(req.params.id)
      io.to(req.params.id).emit('expense_updated', { expense, ledger })
    }

    res.status(201).json({
      success: true,
      message: 'Expense logged successfully.',
      data: expense
    })
  } catch (error) {
    next(error)
  }
}

export const deleteExpense = async (req, res, next) => {
  try {
    await tripRoomService.deleteExpense(req.params.expenseId, req.user.id)

    const io = req.app.get('io')
    if (io) {
      const ledger = await ledgerService.computeTripLedger(req.params.id)
      io.to(req.params.id).emit('expense_deleted', { expenseId: req.params.expenseId, ledger })
    }

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully.'
    })
  } catch (error) {
    next(error)
  }
}

export const initiateSettlement = async (req, res, next) => {
  try {
    const { payeeId, amount, idempotencyKey, paymentMethod } = req.body
    const result = await settlementService.initiateSettlement(
      req.params.id,
      req.user.id,
      payeeId,
      amount,
      idempotencyKey,
      paymentMethod
    )

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit('settlement_initiated', {
        settlementId: result.settlement.id,
        payerId: req.user.id,
        payeeId,
        amount: result.amount
      })
    }

    res.status(201).json({
      success: true,
      message: 'Settlement initiated.',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const mockSettlePayment = async (req, res, next) => {
  try {
    const io = req.app.get('io')
    const settlement = await settlementService.mockSettlePayment(req.params.settlementId, req.user.id, io)
    res.status(200).json({
      success: true,
      message: 'Payment settled in sandbox mode.',
      data: settlement
    })
  } catch (error) {
    next(error)
  }
}

export const getSettlements = async (req, res, next) => {
  try {
    const settlements = await settlementService.getSettlementHistory(req.params.id)
    res.status(200).json({
      success: true,
      data: settlements
    })
  } catch (error) {
    next(error)
  }
}

// 3. POLLS
export const getPolls = async (req, res, next) => {
  try {
    const polls = await tripRoomService.tripRoomRepo.getPollsByActivity(req.params.id)
    res.status(200).json({
      success: true,
      data: polls
    })
  } catch (error) {
    next(error)
  }
}

export const createPoll = async (req, res, next) => {
  try {
    const { question, options } = req.body
    const poll = await tripRoomService.createPoll(req.params.id, req.user.id, question, options)

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit('poll_created', { poll })
    }

    res.status(201).json({
      success: true,
      message: 'Poll created successfully.',
      data: poll
    })
  } catch (error) {
    next(error)
  }
}

export const closePoll = async (req, res, next) => {
  try {
    const poll = await tripRoomService.closePoll(req.params.id, req.params.pollId, req.user.id)

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit('poll_closed', { pollId: req.params.pollId })
    }

    res.status(200).json({
      success: true,
      message: 'Poll closed successfully.',
      data: poll
    })
  } catch (error) {
    next(error)
  }
}

// 4. HOST ACTIONS
export const muteMember = async (req, res, next) => {
  try {
    const { durationHours } = req.body
    const mute = await tripRoomService.muteMember(req.params.id, req.params.userId, durationHours, req.user.id)

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit('member_muted', { userId: req.params.userId, mutedUntil: mute.muted_until })
    }

    res.status(200).json({
      success: true,
      message: `Member muted for ${durationHours} hours.`
    })
  } catch (error) {
    next(error)
  }
}

export const removeMember = async (req, res, next) => {
  try {
    const { member, promoted } = await tripRoomService.removeMember(req.params.id, req.params.userId, req.user.id)

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit('member_removed', { userId: req.params.userId })
      if (promoted) {
        io.to(req.params.id).emit('member_promoted', { member: promoted })
      }
    }

    res.status(200).json({
      success: true,
      message: 'Member removed from trip room.'
    })
  } catch (error) {
    next(error)
  }
}

export const toggleChat = async (req, res, next) => {
  try {
    const { chatEnabled } = req.body
    await tripRoomService.toggleChatEnabled(req.params.id, req.user.id, chatEnabled)

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit(chatEnabled ? 'chat_enabled' : 'chat_disabled')
    }

    res.status(200).json({
      success: true,
      message: `Chat ${chatEnabled ? 'enabled' : 'disabled'} successfully.`
    })
  } catch (error) {
    next(error)
  }
}

export const pinMessage = async (req, res, next) => {
  try {
    const { isPinned } = req.body
    const msg = await tripRoomService.pinTripMessage(req.params.id, req.params.messageId, req.user.id, isPinned)

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit('message_pinned', { messageId: req.params.messageId, isPinned })
    }

    res.status(200).json({
      success: true,
      message: `Message ${isPinned ? 'pinned' : 'unpinned'} successfully.`,
      data: msg
    })
  } catch (error) {
    next(error)
  }
}

export const deleteMessage = async (req, res, next) => {
  try {
    await tripRoomService.deleteTripMessage(req.params.id, req.params.messageId, req.user.id)

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit('message_deleted', { messageId: req.params.messageId })
    }

    res.status(200).json({
      success: true,
      message: 'Message soft-deleted.'
    })
  } catch (error) {
    next(error)
  }
}

export const markTripStarted = async (req, res, next) => {
  try {
    await tripRoomService.markTripStarted(req.params.id, req.user.id)

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit('trip_started')
    }

    res.status(200).json({
      success: true,
      message: 'Trip marked started. Emergency contacts notified.'
    })
  } catch (error) {
    next(error)
  }
}

export const markTripEnded = async (req, res, next) => {
  try {
    await tripRoomService.markTripEnded(req.params.id, req.user.id)

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit('trip_ended')
    }

    res.status(200).json({
      success: true,
      message: 'Trip marked ended.'
    })
  } catch (error) {
    next(error)
  }
}

export const lockUnlockTrip = async (req, res, next) => {
  try {
    const { isLocked } = req.body
    await tripRoomService.lockUnlockTrip(req.params.id, req.user.id, isLocked)

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit(isLocked ? 'group_locked' : 'group_unlocked')
    }

    res.status(200).json({
      success: true,
      message: `Trip group ${isLocked ? 'locked' : 'unlocked'} successfully.`
    })
  } catch (error) {
    next(error)
  }
}

// 5. ONBOARDING & HEALTH DASHBOARD
export const getOnboarding = async (req, res, next) => {
  try {
    const data = await tripRoomService.getOnboarding(req.params.id, req.user.id)
    res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

export const completeOnboarding = async (req, res, next) => {
  try {
    const data = await tripRoomService.completeOnboarding(req.params.id, req.user.id)
    res.status(200).json({
      success: true,
      message: 'Joiner onboarding complete.',
      data
    })
  } catch (error) {
    next(error)
  }
}

export const getHealthMetrics = async (req, res, next) => {
  try {
    const data = await tripRoomService.getHealthMetrics(req.params.id)
    res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}
