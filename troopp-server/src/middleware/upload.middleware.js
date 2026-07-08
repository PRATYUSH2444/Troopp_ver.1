import multer from 'multer'
import { fileTypeFromBuffer } from 'file-type'
import { AppError } from './errorHandler.middleware.js'

// 1. Setup Memory Storage (Buffer in memory, never on local disk)
const storage = multer.memoryStorage()

// 2. Set up initial MIME-type checks
const defaultMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']
const idMimeTypes = [...defaultMimeTypes, 'application/pdf']

const fileFilter = (allowedMimes) => (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimes.join(', ')}`, 400, 'FILE_INVALID_TYPE'), false)
  }
}

// 3. Instantiate Multer instances
const defaultMulter = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter(defaultMimeTypes)
})

const idMulter = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter(idMimeTypes)
})

// Helper middleware to validate magic bytes (Secondary MIME Validation)
const validateMagicBytes = (allowedMimes) => async (req, res, next) => {
  try {
    const files = []
    if (req.file) {
      files.push(req.file)
    }
    if (req.files) {
      if (Array.isArray(req.files)) {
        files.push(...req.files)
      } else {
        Object.values(req.files).forEach((arr) => files.push(...arr))
      }
    }

    for (const file of files) {
      if (!file.buffer) {
        continue
      }
      
      const fileType = await fileTypeFromBuffer(file.buffer)
      
      if (!fileType) {
        return next(new AppError('Uploaded file is corrupted or lacks readable headers.', 400, 'FILE_CORRUPTED'))
      }

      if (!allowedMimes.includes(fileType.mime)) {
        return next(new AppError(`Magic byte validation failed. Real type: ${fileType.mime}. Expected one of: ${allowedMimes.join(', ')}`, 400, 'FILE_INVALID_TYPE'))
      }
    }
    next()
  } catch (err) {
    next(new AppError(`File type validation error: ${err.message}`, 500, 'FILE_VALIDATION_FAILED'))
  }
}

// Middleware exports
export const uploadSingle = (fieldName) => [
  defaultMulter.single(fieldName),
  validateMagicBytes(defaultMimeTypes)
]

export const uploadMultiple = (fieldName, maxCount = 5) => [
  defaultMulter.array(fieldName, maxCount),
  validateMagicBytes(defaultMimeTypes)
]

export const uploadID = (fieldName) => [
  idMulter.single(fieldName),
  validateMagicBytes(idMimeTypes)
]
