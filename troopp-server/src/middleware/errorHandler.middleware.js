import logger from '../config/logger.js'

// Custom AppError class to throw operational errors
export class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR', fields = null) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.fields = fields
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

const errorHandler = (err, req, res, next) => {
  let error = {
    statusCode: err.statusCode || 500,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    message: err.message || 'Something went wrong on our end. Please try again later.',
    fields: err.fields || null,
  }

  // Log the complete error stack in Winston
  logger.error(`Error processing request [${req.method} ${req.originalUrl}] [Req ID: ${req.id || 'N/A'}]:`, err)

  // 1. Sequelize Database Validation Errors
  if (err.name === 'SequelizeValidationError') {
    error.statusCode = 400
    error.code = 'DB_VALIDATION_ERROR'
    error.message = 'Database validation check failed.'
    error.fields = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }))
  }

  // 2. Sequelize Database Unique Constraint Errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    error.statusCode = 409
    error.code = 'DB_UNIQUE_CONSTRAINT_ERROR'
    error.message = 'A record with this value already exists.'
    error.fields = err.errors.map((e) => ({
      field: e.path,
      message: `${e.path} must be unique.`,
    }))
  }

  // 3. JWT Verification Errors
  if (err.name === 'JsonWebTokenError') {
    error.statusCode = 401
    error.code = 'JWT_INVALID'
    error.message = 'Provided authorization token is invalid.'
  }

  if (err.name === 'TokenExpiredError') {
    error.statusCode = 401
    error.code = 'JWT_EXPIRED'
    error.message = 'Authorization token has expired. Please login again.'
  }

  // 4. Multer Upload Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.statusCode = 400
    error.code = 'FILE_TOO_LARGE'
    error.message = 'The uploaded file exceeds the maximum allowed size of 5MB.'
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.statusCode = 400
    error.code = 'FILE_LIMIT_EXCEEDED'
    error.message = 'Unexpected file field or maximum files exceeded.'
  }

  // Hide stack trace and internal errors in production
  const showDetails = process.env.NODE_ENV === 'development'

  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.fields && { fields: error.fields }),
      ...(showDetails && { stack: err.stack }),
      requestId: req.id,
    },
  })
}

export default errorHandler
