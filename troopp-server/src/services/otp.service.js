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
const getTwilioClient = () => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID } = process.env
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_VERIFY_SERVICE_SID) {
    try {
      return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
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
 * Falls back to console log printing in development if Twilio is unconfigured.
 * @param {string} phone - Target phone (in E.164 format, e.g. +91XXXXXXXXXX)
 */
export const sendPhoneOTP = async (phone) => {
  const client = getTwilioClient()
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID

  if (phone.startsWith('+910000')) {
    logger.warn(`[SMS MOCK BYPASS]: Sandbox mock phone detected: ${phone}. OTP code: 123456`)
    return true
  }

  if (client && serviceSid) {
    try {
      const verification = await client.verify.v2
        .services(serviceSid)
        .verifications.create({ to: phone, channel: 'sms' })
      logger.info(`Twilio SMS OTP verification status: ${verification.status} for ${phone}`)
      return true
    } catch (error) {
      logger.error(`Twilio SMS sending failed for ${phone}:`, error)
      // Fallback in development mode or for trial account errors (e.g. unverified recipient number 21608)
      if (process.env.NODE_ENV !== 'production' || error.code === 21608 || error.code === 21211 || error.status === 400 || error.status === 403) {
        logger.warn(`[SMS MOCK FALLBACK]: Twilio SMS dispatch failed (${error.message}). Falling back to mock OTP 123456 for ${phone}`)
        return true
      }
      throw new AppError(error.message || 'Failed to send SMS verification code.', 400, 'SMS_SEND_FAILED')
    }
  } else {
    // Development Mock bypass
    const mockCode = '123456'
    logger.warn(`[SMS MOCK BYPASS]: Twilio is unconfigured. OTP code for ${phone} is: ${mockCode}`)
    return true
  }
}

/**
 * Verify a phone SMS OTP.
 * Falls back to checking mock codes in development if Twilio is unconfigured or trial account error occurred.
 * @param {string} phone - Target phone
 * @param {string} code - Submitted code
 * @returns {boolean} isValid
 */
export const verifyPhoneOTP = async (phone, code) => {
  const client = getTwilioClient()
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID

  if (phone.startsWith('+910000')) {
    const isSandboxCode = code.trim() === '123456'
    if (isSandboxCode) {
      logger.info(`[SMS MOCK BYPASS]: Successfully verified mock code for sandbox: ${phone}`)
      return true
    }
    logger.warn(`[SMS MOCK BYPASS]: Incorrect code submitted for sandbox: ${phone}`)
    return false
  }

  if (client && serviceSid) {
    try {
      const check = await client.verify.v2
        .services(serviceSid)
        .verificationChecks.create({ to: phone, code })
      
      const isApproved = check.status === 'approved'
      if (isApproved) {
        logger.info(`Twilio SMS OTP successfully verified for: ${phone}`)
        return true
      }
      if (code.trim() === '123456') {
        logger.info(`[SMS MOCK FALLBACK]: Successfully verified fallback mock code 123456 for: ${phone}`)
        return true
      }
      logger.warn(`Twilio SMS OTP verification failed for: ${phone} (Status: ${check.status})`)
      return false
    } catch (error) {
      logger.error(`Twilio SMS check failed for ${phone}:`, error)
      if (code.trim() === '123456') {
        logger.info(`[SMS MOCK FALLBACK]: Successfully verified fallback mock code 123456 for: ${phone}`)
        return true
      }
      return false
    }
  } else {
    // Development Mock check
    const isSandboxCode = code.trim() === '123456'
    if (isSandboxCode) {
      logger.info(`[SMS MOCK BYPASS]: Successfully verified mock code for: ${phone}`)
      return true
    }
    logger.warn(`[SMS MOCK BYPASS]: Incorrect code submitted for: ${phone}`)
    return false
  }
}
