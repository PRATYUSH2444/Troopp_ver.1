import * as tripRoomService from './trip-room.service.js'
import logger from '../../config/logger.js'

/**
 * REST Controllers for Trip Room endpoints.
 */

// 1. CHAT MESSAGES
export const getMessages = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const messages = await tripRoomService.getMessages(req.params.id, limit, offset)
    res.status(200).json({
      success: true,
      data: messages
    })
  } catch (error) {
    next(error)
  }
}

// 2. EXPENSES
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

export const createExpense = async (req, res, next) => {
  try {
    const { amount, description, splitType, customSplits } = req.body
    const expense = await tripRoomService.createExpense(
      req.params.id,
      req.user.id,
      amount,
      description,
      splitType,
      customSplits
    )

    // Broadcast update via sockets
    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit('expense_updated', { expense })
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
      io.to(req.params.id).emit('expense_deleted', { expenseId: req.params.expenseId })
    }

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully.'
    })
  } catch (error) {
    next(error)
  }
}

export const settleSplit = async (req, res, next) => {
  try {
    const split = await tripRoomService.settleSplit(req.params.splitId)

    const io = req.app.get('io')
    if (io) {
      io.to(req.params.id).emit('split_settled', { splitId: req.params.splitId, split })
    }

    res.status(200).json({
      success: true,
      message: 'Expense split marked settled.',
      data: split
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
