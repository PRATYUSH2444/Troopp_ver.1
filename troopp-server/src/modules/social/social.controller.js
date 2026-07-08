import * as socialService from './social.service.js'

/**
 * Handles follow/unfollow and blocking actions in REST requests.
 */

export const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params
    const follow = await socialService.followUser(req.user.id, userId)
    res.status(200).json({
      success: true,
      message: 'User followed successfully.',
      data: follow
    })
  } catch (error) {
    next(error)
  }
}

export const unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params
    await socialService.unfollowUser(req.user.id, userId)
    res.status(200).json({
      success: true,
      message: 'User unfollowed successfully.'
    })
  } catch (error) {
    next(error)
  }
}

export const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params
    const list = await socialService.getFollowers(userId)
    res.status(200).json({
      success: true,
      data: list
    })
  } catch (error) {
    next(error)
  }
}

export const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params
    const list = await socialService.getFollowing(userId)
    res.status(200).json({
      success: true,
      data: list
    })
  } catch (error) {
    next(error)
  }
}

export const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params
    const result = await socialService.blockUser(req.user.id, userId)
    res.status(200).json({
      success: true,
      message: 'User blocked successfully.',
      data: result.block,
      sharedTripsToPrompt: result.sharedTripsToPrompt
    })
  } catch (error) {
    next(error)
  }
}

export const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params
    await socialService.unblockUser(req.user.id, userId)
    res.status(200).json({
      success: true,
      message: 'User unblocked successfully.'
    })
  } catch (error) {
    next(error)
  }
}
