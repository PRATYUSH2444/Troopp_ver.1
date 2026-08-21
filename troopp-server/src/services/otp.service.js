import logger from '../config/logger.js'
import twilio from 'twilio'

import { getRedisClient, isRedisHealthy } from '../config/redis.js'
import { AppError } from '../middleware/errorHandler.middleware.js'

// Retrieve expiry limits from environment (default: 10 minutes)
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10)

/**
 * Initialize Twilio Client only if credentials are set.
 * Returns null if credentials are not configured.
 */
/**
 * Initialize Twilio Client only if credentials are set.
 * Returns null if credentials are not configured.
 */
const getTwilioClient = () => {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim()
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim()
  const serviceSid = (process.env.TWILIO_VERIFY_SERVICE_SID || '').trim()

  if (accountSid && authToken && serviceSid) {
    try {
      return twilio(accountSid, authToken)
    } catch (error) {
      logger.error('Failed to initialize Twilio client:', error)
      return null
    }
  }
  return null
}

/**
 * Generate 6-digit random numeric string.
 */
const generate6DigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ============================================================================
// EMAIL OTP METHODS
// ============================================================================

// Ephemeral in-memory store for non-production/test mode fallback
const emailOtpCache = new Map()

/**
 * Generate and cache a 6-digit OTP for email verification.
 * @param {string} email - Destination email
 * @returns {Promise<string>|string} generated code
 */
export const generateEmailOTP = (email) => {
  const normalizedEmail = email.toLowerCase().trim()
  const code = generate6DigitCode()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  // Always seed in-memory cache for high availability
  emailOtpCache.set(normalizedEmail, { code, expiresAt })

  if (isRedisHealthy()) {
    const redis = getRedisClient()
    return (async () => {
      try {
        await redis.setex(`otp:email:${normalizedEmail}`, OTP_EXPIRY_MINUTES * 60, code)
        logger.info(`Generated Email OTP for: ${normalizedEmail} (Redis cached)`)
        return code
      } catch (err) {
        logger.warn('Failed to save OTP to Redis, using in-memory cache:', err.message)
        return code
      }
    })()
  }

  logger.info(`Generated Email OTP for: ${normalizedEmail} (In-memory cached)`)
  return code
}

/**
 * Verify a submitted Email OTP.
 * @param {string} email - Destination email
 * @param {string} code - Submitted code
 * @returns {Promise<boolean>|boolean} isValid
 */
export const verifyEmailOTP = (email, code) => {
  const normalizedEmail = email.toLowerCase().trim()

  if (isRedisHealthy()) {
    const redis = getRedisClient()
    return (async () => {
      try {
        const cachedCode = await redis.get(`otp:email:${normalizedEmail}`)
        if (cachedCode && cachedCode === code.trim()) {
          await redis.del(`otp:email:${normalizedEmail}`)
          emailOtpCache.delete(normalizedEmail)
          return true
        }
      } catch (err) {
        logger.warn('Redis OTP verification query error, falling back to in-memory cache:', err.message)
      }

      // Check in-memory fallback if Redis check returns false/fails
      const cachedData = emailOtpCache.get(normalizedEmail)
      if (!cachedData) return false
      if (new Date() > new Date(cachedData.expiresAt)) {
        emailOtpCache.delete(normalizedEmail)
        return false
      }
      if (cachedData.code !== code.trim()) return false
      emailOtpCache.delete(normalizedEmail)
      return true
    })()
  }

  // Pure in-memory check when Redis is unavailable
  const cachedData = emailOtpCache.get(normalizedEmail)
  if (!cachedData) return false
  if (new Date() > new Date(cachedData.expiresAt)) {
    emailOtpCache.delete(normalizedEmail)
    return false
  }
  if (cachedData.code !== code.trim()) return false
  emailOtpCache.delete(normalizedEmail)
  return true
}

// ============================================================================
// PHONE OTP METHODS (Twilio Verify)
// ============================================================================

/**
 * Send an OTP verification code via SMS to user phone.
 * @param {string} phone - Target phone (in E.164 format, e.g. +91XXXXXXXXXX)
 */
export const sendPhoneOTP = async (phone) => {
  const client = getTwilioClient()
  const serviceSid = (process.env.TWILIO_VERIFY_SERVICE_SID || '').trim()

  if (phone.startsWith('+910000')) {
    logger.warn(`[SMS MOCK BYPASS]: Sandbox mock phone detected: ${phone}. OTP code: 123456`)
    return true
  }

  if (!client || !serviceSid) {
    throw new AppError(
      'SMS verification is not configured on the server. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in the Render environment variables.',
      500,
      'SMS_PROVIDER_NOT_CONFIGURED'
    )
  }

  try {
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phone, channel: 'sms' })
    logger.info(`Twilio SMS OTP verification status: ${verification.status} for ${phone}`)
    return true
  } catch (error) {
    logger.error(`Twilio SMS sending failed for ${phone}:`, error)
    throw new AppError(`SMS delivery failed: ${error.message}`, 400, 'SMS_SEND_FAILED')
  }
}

/**
 * Verify a phone SMS OTP.
 * @param {string} phone - Target phone
 * @param {string} code - Submitted code
 * @returns {boolean} isValid
 */
export const verifyPhoneOTP = async (phone, code) => {
  const client = getTwilioClient()
  const serviceSid = (process.env.TWILIO_VERIFY_SERVICE_SID || '').trim()

  if (phone.startsWith('+910000')) {
    const isSandboxCode = code.trim() === '123456'
    if (isSandboxCode) {
      logger.info(`[SMS MOCK BYPASS]: Successfully verified mock code for sandbox: ${phone}`)
      return true
    }
    return false
  }

  if (!client || !serviceSid) {
    throw new AppError(
      'SMS verification is not configured on the server. Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID in the Render environment variables.',
      500,
      'SMS_PROVIDER_NOT_CONFIGURED'
    )
  }

  try {
    const check = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phone, code: code.trim() })

    const isApproved = check.status === 'approved'
    if (isApproved) {
      logger.info(`Twilio SMS OTP successfully verified for: ${phone}`)
      return true
    }
    logger.warn(`Twilio SMS OTP verification rejected for: ${phone} (Status: ${check.status})`)
    return false
  } catch (error) {
    logger.error(`Twilio SMS check failed for ${phone}:`, error)
    throw new AppError(`SMS verification error: ${error.message}`, 400, 'SMS_CHECK_FAILED')
  }
}
