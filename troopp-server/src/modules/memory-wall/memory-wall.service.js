import MemoryWall from '../../models/MemoryWall.js'
import MemoryPhoto from '../../models/MemoryPhoto.js'
import Activity from '../../models/Activity.js'
import ActivityMember from '../../models/ActivityMember.js'
import User from '../../models/User.js'
import Profile from '../../models/Profile.js'
import { AppError } from '../../middleware/errorHandler.middleware.js'
import { uploadToCloudinary } from '../../config/cloudinary.js'
import logger from '../../config/logger.js'

/**
 * Fetch a memory wall by activity ID (self-heals if not created yet).
 */
export const getMemoryWall = async (activityId) => {
  const activity = await Activity.findByPk(activityId)
  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  // Self-heal / Auto-create memory wall for completed activities
  const [wall] = await MemoryWall.findOrCreate({
    where: { activity_id: activityId }
  })

  const photos = await MemoryPhoto.findAll({
    where: { memory_wall_id: wall.id },
    order: [['created_at', 'DESC']],
    include: [
      {
        model: User,
        as: 'Uploader',
        attributes: ['id'],
        include: [{ model: Profile, as: 'Profile', attributes: ['name', 'avatar_url'] }]
      }
    ]
  })

  return {
    wall,
    activity: {
      id: activity.id,
      title: activity.title,
      date_time: activity.date_time,
      destination: activity.destination
    },
    photos: photos.map((p) => ({
      id: p.id,
      url: p.photo_url,
      caption: p.caption,
      uploadedAt: p.created_at,
      uploader: {
        id: p.Uploader?.id,
        name: p.Uploader?.Profile?.name || 'Explorer',
        avatarUrl: p.Uploader?.Profile?.avatar_url
      }
    }))
  }
}

/**
 * Upload photos to memory wall (Multer buffer -> Cloudinary -> Database).
 */
export const uploadPhotos = async (activityId, userId, files) => {
  if (!files || files.length === 0) {
    throw new AppError('No photo files provided for upload.', 400, 'NO_FILES')
  }

  const activity = await Activity.findByPk(activityId)
  if (!activity) {
    throw new AppError('Activity not found.', 404, 'ACTIVITY_NOT_FOUND')
  }

  // 1. Verify activity is completed
  if (activity.status !== 'completed') {
    throw new AppError('Photos can only be uploaded to completed trips.', 400, 'TRIP_NOT_COMPLETED')
  }

  // 2. Verify user is confirmed member
  const member = await ActivityMember.findOne({
    where: { activity_id: activityId, user_id: userId, status: 'confirmed' }
  })
  if (!member) {
    throw new AppError('Access denied: You must be a confirmed participant to upload.', 403, 'NOT_PARTICIPANT')
  }

  // 3. Verify within 48hr window of trip completion
  const tripTime = new Date(activity.date_time).getTime()
  const windowExpiry = tripTime + 48 * 60 * 60 * 1000
  if (Date.now() > windowExpiry) {
    throw new AppError('The 48-hour upload window has closed.', 400, 'WINDOW_CLOSED')
  }

  const [wall] = await MemoryWall.findOrCreate({
    where: { activity_id: activityId }
  })

  // 4. Verify maximum photo limit (10 photos per user per trip)
  const currentCount = await MemoryPhoto.count({
    where: { memory_wall_id: wall.id, uploader_id: userId }
  })
  if (currentCount + files.length > 10) {
    throw new AppError(`Upload limit exceeded. You can upload at most 10 photos. You already uploaded ${currentCount} photos.`, 400, 'LIMIT_EXCEEDED')
  }

  // 5. Upload buffers to Cloudinary in parallel
  const uploadPromises = files.map(async (file) => {
    try {
      const result = await uploadToCloudinary(file.buffer, {
        folder: `troopp-memories/${activityId}`
      })

      // Insert row in MemoryPhoto
      return await MemoryPhoto.create({
        memory_wall_id: wall.id,
        uploader_id: userId,
        photo_url: result.secure_url,
        caption: file.originalname || 'Trip Memory'
      })
    } catch (err) {
      logger.error('Failed uploading memory photo:', err)
      throw new AppError('Failed uploading photos to Cloudinary.', 500, 'UPLOAD_FAILED')
    }
  })

  return await Promise.all(uploadPromises)
}
