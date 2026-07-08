import * as ratingsService from './ratings.service.js'

/**
 * Handles incoming Express operations for Co-Traveler Ratings.
 */

export const getRateableMembers = async (req, res, next) => {
  try {
    const members = await ratingsService.getRateableMembers(req.params.activityId, req.user.id)
    res.status(200).json({
      success: true,
      data: members
    })
  } catch (error) {
    next(error)
  }
}

export const submitRatings = async (req, res, next) => {
  try {
    const { ratings } = req.body
    await ratingsService.submitRatings(req.params.activityId, req.user.id, ratings)
    res.status(200).json({
      success: true,
      message: 'Ratings submitted successfully. Trust metrics updated.'
    })
  } catch (error) {
    next(error)
  }
}
