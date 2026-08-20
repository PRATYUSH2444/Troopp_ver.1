import * as communityService from '../services/community.service.js'
import { AppError } from '../middleware/errorHandler.middleware.js'

export const createBoard = async (req, res, next) => {
  try {
    const board = await communityService.createBoard(req.user.id, req.body)
    res.status(201).json({
      status: 'success',
      data: { board }
    })
  } catch (err) {
    next(err)
  }
}

export const getBoard = async (req, res, next) => {
  try {
    const board = await communityService.getBoard(req.params.boardName)
    if (!board) {
      return res.status(404).json({
        status: 'fail',
        message: 'Board not found'
      })
    }
    res.status(200).json({
      status: 'success',
      data: { board }
    })
  } catch (err) {
    next(err)
  }
}

export const listBoards = async (req, res, next) => {
  try {
    const { q, limit, cursor } = req.query
    const result = await communityService.listBoards(q, limit, cursor)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    next(err)
  }
}

export const subscribeBoard = async (req, res, next) => {
  try {
    const result = await communityService.subscribeBoard(req.user.id, req.params.boardName)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    next(err)
  }
}

export const unsubscribeBoard = async (req, res, next) => {
  try {
    const result = await communityService.unsubscribeBoard(req.user.id, req.params.boardName)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    next(err)
  }
}

export const getSubscriptionStatus = async (req, res, next) => {
  try {
    const result = await communityService.getSubscriptionStatus(req.user.id, req.params.boardName)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    next(err)
  }
}

export const createPost = async (req, res, next) => {
  try {
    const post = await communityService.createPost(req.user.id, req.body)
    res.status(201).json({
      status: 'success',
      data: { post }
    })
  } catch (err) {
    next(err)
  }
}

export const getPost = async (req, res, next) => {
  try {
    const post = await communityService.getPost(req.params.postId, req.user?.id)
    if (!post) {
      return res.status(404).json({
        status: 'fail',
        message: 'Post not found'
      })
    }
    res.status(200).json({
      status: 'success',
      data: { post }
    })
  } catch (err) {
    next(err)
  }
}

export const listPosts = async (req, res, next) => {
  try {
    const { board_name, sort, limit, cursor } = req.query
    const result = await communityService.listPosts(board_name, sort, limit, cursor, req.user?.id)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    next(err)
  }
}

export const castVote = async (req, res, next) => {
  try {
    const { target_type, target_id, vote_value } = req.body
    const result = await communityService.castVote(req.user.id, target_type, target_id, vote_value)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    next(err)
  }
}

export const createComment = async (req, res, next) => {
  try {
    const comment = await communityService.createComment(req.user.id, req.params.postId, req.body.content, req.body.parent_id)
    res.status(201).json({
      status: 'success',
      data: { comment }
    })
  } catch (err) {
    next(err)
  }
}

export const listComments = async (req, res, next) => {
  try {
    const comments = await communityService.listComments(req.params.postId, req.user?.id)
    res.status(200).json({
      status: 'success',
      data: { comments }
    })
  } catch (err) {
    next(err)
  }
}

export const toggleSaveItem = async (req, res, next) => {
  try {
    const { target_type, target_id } = req.body
    const result = await communityService.toggleSaveItem(req.user.id, target_type, target_id)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    next(err)
  }
}

export const deletePost = async (req, res, next) => {
  try {
    const result = await communityService.softDeletePost(req.user.id, req.params.postId)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    next(err)
  }
}

export const deleteComment = async (req, res, next) => {
  try {
    const result = await communityService.softDeleteComment(req.user.id, req.params.commentId)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    next(err)
  }
}

export const editPost = async (req, res, next) => {
  try {
    const post = await communityService.editPost(req.user.id, req.params.postId, req.body.content)
    res.status(200).json({
      status: 'success',
      data: { post }
    })
  } catch (err) {
    next(err)
  }
}

export const editComment = async (req, res, next) => {
  try {
    const comment = await communityService.editComment(req.user.id, req.params.commentId, req.body.content)
    res.status(200).json({
      status: 'success',
      data: { comment }
    })
  } catch (err) {
    next(err)
  }
}

export const reportItem = async (req, res, next) => {
  try {
    const { target_type, target_id, reason } = req.body
    const report = await communityService.reportItem(req.user.id, target_type, target_id, reason)
    res.status(201).json({
      status: 'success',
      data: { report }
    })
  } catch (err) {
    next(err)
  }
}

export const listModerationQueue = async (req, res, next) => {
  try {
    const reports = await communityService.listModerationQueue(req.user.id)
    res.status(200).json({
      status: 'success',
      data: { reports }
    })
  } catch (err) {
    if (err.message && (err.message.includes('Access denied') || err.message.includes('Unauthorized'))) {
      return next(new AppError(err.message, 403, 'MODERATOR_REQUIRED'))
    }
    next(err)
  }
}

export const resolveModerationAction = async (req, res, next) => {
  try {
    const { action } = req.body
    const result = await communityService.resolveModerationAction(req.user.id, req.params.reportId, action)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    if (err.message && (err.message.includes('Access denied') || err.message.includes('Unauthorized'))) {
      return next(new AppError(err.message, 403, 'MODERATOR_REQUIRED'))
    }
    next(err)
  }
}

export const castPollVote = async (req, res, next) => {
  try {
    const { option_id } = req.body
    const result = await communityService.castPollVote(req.user.id, req.params.postId, option_id)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    next(err)
  }
}

export const banMember = async (req, res, next) => {
  try {
    const { target_user_id, reason } = req.body
    const result = await communityService.banMember(req.user.id, req.params.boardName, target_user_id, reason)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    if (err.message && err.message.includes('Unauthorized')) {
      return next(new AppError(err.message, 403, 'MODERATOR_REQUIRED'))
    }
    next(err)
  }
}

export const unbanMember = async (req, res, next) => {
  try {
    const result = await communityService.unbanMember(req.user.id, req.params.boardName, req.params.userId)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    if (err.message && err.message.includes('Unauthorized')) {
      return next(new AppError(err.message, 403, 'MODERATOR_REQUIRED'))
    }
    next(err)
  }
}

export const getPresignedUploadUrl = async (req, res, next) => {
  try {
    const { file_name, file_type, file_size } = req.body
    if (!file_name || !file_type || !file_size) {
      return next(new AppError('file_name, file_type, and file_size are required.', 400, 'VALIDATION_ERROR'))
    }

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm']
    const isImage = allowedImageTypes.includes(file_type)
    const isVideo = allowedVideoTypes.includes(file_type)

    if (!isImage && !isVideo) {
      return next(new AppError('Disallowed file type. Only JPEG, PNG, GIF, WEBP, MP4, MOV, and WEBM are allowed.', 400, 'INVALID_FILE_TYPE'))
    }

    const maxImageSize = 10 * 1024 * 1024 // 10MB
    const maxVideoSize = 50 * 1024 * 1024 // 50MB

    if (isImage && file_size > maxImageSize) {
      return next(new AppError('Image file size exceeds the 10MB limit.', 400, 'FILE_TOO_LARGE'))
    }
    if (isVideo && file_size > maxVideoSize) {
      return next(new AppError('Video file size exceeds the 50MB limit.', 400, 'FILE_TOO_LARGE'))
    }

    const timestamp = Math.round(new Date().getTime() / 1000)
    const folder = 'troopp_community'
    
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    const apiKey = process.env.CLOUDINARY_API_KEY
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME

    let signature = 'mock_signature'
    if (apiSecret && apiKey && cloudName) {
      const { default: cloudinary } = await import('../config/cloudinary.js')
      signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret)
    }

    res.status(200).json({
      status: 'success',
      data: {
        upload_url: cloudName ? `https://api.cloudinary.com/v1_1/${cloudName}/upload` : 'https://api.cloudinary.com/v1_1/mock-cloud/upload',
        fields: {
          timestamp,
          folder,
          api_key: apiKey || 'mock_api_key',
          signature
        }
      }
    })
  } catch (err) {
    next(err)
  }
}

export const completeUpload = async (req, res, next) => {
  try {
    const { media_url, file_type } = req.body
    if (!media_url || !file_type) {
      return next(new AppError('media_url and file_type are required.', 400, 'VALIDATION_ERROR'))
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/webm'
    ]
    if (!allowedTypes.includes(file_type)) {
      return next(new AppError('Invalid file type registered.', 400, 'INVALID_FILE_TYPE'))
    }

    if (!media_url.startsWith('http://') && !media_url.startsWith('https://')) {
      return next(new AppError('Invalid media URL format.', 400, 'INVALID_URL'))
    }

    res.status(200).json({
      status: 'success',
      data: {
        registered: true,
        media_url,
        file_type
      }
    })
  } catch (err) {
    next(err)
  }
}

export const listNotifications = async (req, res, next) => {
  try {
    const { limit, cursor } = req.query
    const result = await communityService.listNotifications(req.user.id, limit, cursor)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    next(err)
  }
}

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const result = await communityService.markNotificationAsRead(req.user.id, req.params.id)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    if (err.message && err.message.includes('not found')) {
      return next(new AppError(err.message, 404, 'NOT_FOUND'))
    }
    next(err)
  }
}

export const searchCommunity = async (req, res, next) => {
  try {
    const { q } = req.query
    if (!q) {
      return res.status(200).json({
        status: 'success',
        data: { boards: [], posts: [] }
      })
    }
    const result = await communityService.searchCommunity(q)
    res.status(200).json({
      status: 'success',
      data: result
    })
  } catch (err) {
    next(err)
  }
}
