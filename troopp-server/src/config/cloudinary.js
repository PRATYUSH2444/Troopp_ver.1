import { v2 as cloudinary } from 'cloudinary'
import logger from './logger.js'

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true
  })
  logger.info('Cloudinary successfully initialized.')
} else {
  logger.warn('Cloudinary keys are not fully configured. Media uploads will run in mock filesystem mode.')
}

/**
 * Upload a memory file buffer directly to Cloudinary.
 * @param {Buffer} fileBuffer - File buffer from multer memory
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} Cloudinary API response
 */
export const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      // Mock Upload success for development
      const mockUrl = `https://res.cloudinary.com/mock-cloud/image/upload/v12345/${options.folder || 'troopp'}/mock-file.jpg`
      logger.info(`[CLOUDINARY MOCK]: Uploaded file to: ${mockUrl}`)
      return resolve({
        secure_url: mockUrl,
        public_id: `mock-public-id-${Date.now()}`
      })
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        logger.error('Cloudinary stream upload failed:', error)
        reject(error)
      } else {
        resolve(result)
      }
    })

    uploadStream.end(fileBuffer)
  })
}

export default cloudinary
