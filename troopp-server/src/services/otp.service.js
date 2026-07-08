import logger from '../config/logger.js'
import twilio from 'twilio'

// Ephemeral in-memory store for Email OTPs: email -> { code, expiresAt }
const emailOtpCache = new Map()

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

/**
 * Generate and cache a 6-digit OTP for email verification.
 * @param {string} email - Destination email
 * @returns {string} generated code
 */
export const generateEmailOTP = (email) => {
  const normalizedEmail = email.toLowerCase().trim()
  const code = generate6DigitCode()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  emailOtpCache.set(normalizedEmail, { code, expiresAt })
  logger.info(`Generated Email OTP for: ${normalizedEmail} (Valid for ${OTP_EXPIRY_MINUTES}m)`)
  return code
}

/**
 * Verify a submitted Email OTP.
 * @param {string} email - Destination email
 * @param {string} code - Submitted code
 * @returns {boolean} isValid
 */
export const verifyEmailOTP = (email, code) => {
  const normalizedEmail = email.toLowerCase().trim()
  const cachedData = emailOtpCache.get(normalizedEmail)

  if (!cachedData) {
    logger.warn(`Email OTP verification failed: No code cached for ${normalizedEmail}`)
    return false
  }

  const { code: cachedCode, expiresAt } = cachedData

  // Check expiration
  if (new Date() > new Date(expiresAt)) {
    logger.warn(`Email OTP verification failed: Cached code for ${normalizedEmail} has expired.`)
    emailOtpCache.delete(normalizedEmail)
    return false
  }

  // Check code match
  if (cachedCode !== code.trim()) {
    logger.warn(`Email OTP verification failed: Incorrect code submitted for ${normalizedEmail}`)
    return false
  }

  // Clear verification cache on success to prevent reuse
  emailOtpCache.delete(normalizedEmail)
  logger.info(`Email OTP successfully verified for: ${normalizedEmail}`)
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

  if (client && serviceSid) {
    try {
      const verification = await client.verify.v2
        .services(serviceSid)
        .verifications.create({ to: phone, channel: 'sms' })
      logger.info(`Twilio SMS OTP verification status: ${verification.status} for ${phone}`)
      return true
    } catch (error) {
      logger.error(`Twilio SMS sending failed for ${phone}:`, error)
      throw error
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
 * Falls back to checking mock codes in development if Twilio is unconfigured.
 * @param {string} phone - Target phone
 * @param {string} code - Submitted code
 * @returns {boolean} isValid
 */
export const verifyPhoneOTP = async (phone, code) => {
  const client = getTwilioClient()
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID

  if (client && serviceSid) {
    try {
      const check = await client.verify.v2
        .services(serviceSid)
        .verificationChecks.create({ to: phone, code })
      
      const isApproved = check.status === 'approved'
      if (isApproved) {
        logger.info(`Twilio SMS OTP successfully verified for: ${phone}`)
      } else {
        logger.warn(`Twilio SMS OTP verification failed for: ${phone} (Status: ${check.status})`)
      }
      return isApproved
    } catch (error) {
      logger.error(`Twilio SMS check failed for ${phone}:`, error)
      throw error
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
