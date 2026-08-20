import Joi from 'joi'
import { AppError } from './errorHandler.middleware.js'

/**
 * Higher-Order Middleware to validate req.body against a Joi schema.
 * Throws a formatted Joi validation error.
 */
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // Return all validation errors, not just the first
    stripUnknown: true, // Filter out parameters not defined in schema
  })

  if (error) {
    const fields = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/"/g, '')
    }))
    
    return next(new AppError('Request validation failed.', 400, 'VALIDATION_ERROR', fields))
  }

  // Replace req.body with the sanitized values returned by Joi
  req.body = value
  next()
}

// ============================================================================
// JOI AUTH SCHEMA DEFINITIONS
// ============================================================================

export const signupSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'any.required': 'Email address is required.'
  })
})

export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'Verification code must be exactly 6 digits.',
    'string.pattern': 'Verification code must contain digits only.'
  })
})

export const verifyPhoneSchema = Joi.object({
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+91\d{10}$/).required().messages({
    'string.pattern': 'Phone number must be in E.164 format with +91 country code (e.g. +919876543210).'
  })
})

export const verifyPhoneCheckSchema = Joi.object({
  phone: Joi.string().pattern(/^\+91\d{10}$/).required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'SMS code must be exactly 6 digits.'
  })
})

export const completeSignupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(50).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required().messages({
    'string.pattern': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    'string.min': 'Password must be at least 8 characters long.'
  }),
  name: Joi.string().min(2).max(150).required().messages({
    'string.min': 'Name must be at least 2 characters long.'
  }),
  dob: Joi.date().raw().required().custom((value, helpers) => {
    const today = new Date()
    const birthDate = new Date(value)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    if (age < 18) {
      return helpers.message('You must be at least 18 years old to complete registration.')
    }
    return value
  }).messages({
    'any.required': 'Date of birth is required for age verification.'
  }),
  tos_accepted: Joi.boolean().invalid(false).required().messages({
    'any.invalid': 'You must accept the Terms of Service to register.',
    'any.required': 'Terms of Service acceptance is required.'
  }),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').default('prefer_not_to_say'),
  city_id: Joi.string().uuid().required().messages({
    'string.uuid': 'Please select a valid city.',
    'any.required': 'City selection is required.'
  }),
  interest_tags: Joi.array().items(Joi.string()).optional()
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address.'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required.'
  })
})

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
})

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Password reset token is required.'
  }),
  password: Joi.string().min(8).max(50).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).required().messages({
    'string.pattern': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
  })
})

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(150).optional(),
  bio: Joi.string().min(10).max(500).allow('').optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
  cityId: Joi.string().uuid().optional(),
  interestTags: Joi.array().items(
    Joi.string().valid('Trekking', 'Camping', 'Photography Walk', 'Road Trips', 'Night Drives', 'Cycling', 'Heritage Walks', 'Day Trips')
  ).max(8).optional()
})

export default validate
