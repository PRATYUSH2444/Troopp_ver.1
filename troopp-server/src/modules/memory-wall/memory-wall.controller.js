import * as memoryWallService from './memory-wall.service.js'

/**
 * Handles incoming Express requests for Memory Walls.
 */

export const getMemoryWall = async (req, res, next) => {
  try {
    const data = await memoryWallService.getMemoryWall(req.params.activityId)
    res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    next(error)
  }
}

export const uploadPhotos = async (req, res, next) => {
  try {
    const photos = await memoryWallService.uploadPhotos(req.params.activityId, req.user.id, req.files)
    res.status(201).json({
      success: true,
      message: 'Photos uploaded successfully to your memory wall.',
      data: photos
    })
  } catch (error) {
    next(error)
  }
}
