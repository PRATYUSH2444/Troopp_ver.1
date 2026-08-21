import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

import User from '../models/User.js'
import Profile from '../models/Profile.js'
import EmergencyContact from '../models/EmergencyContact.js'
import NotificationPreference from '../models/NotificationPreference.js'
import TokenBlacklist from '../models/TokenBlacklist.js'
import City, { DEFAULT_CITIES } from '../models/City.js'

import { AppError } from '../middleware/errorHandler.middleware.js'
import { generateEmailOTP, verifyEmailOTP, sendPhoneOTP, verifyPhoneOTP } from '../services/otp.service.js'
import { sendOTPEmail, sendResetPasswordEmail } from '../services/email.service.js'
import logger from '../config/logger.js'

// Token Secrets
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const RESET_SECRET = process.env.JWT_RESET_SECRET || 'password_reset_token_secret_key_123456'
const DUMMY_HASH = process.env.BCRYPT_DUMMY_HASH || '$2b$12$LRY.L9zZ4CWhGz5hS9d/QeO2X9vYc4h84.s2f.H/K9O0zZ9zZ9zZ.'

const isValidEmail = (email) => {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

// Cookie settings for refresh token
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
}

/**
 * Generate access and refresh tokens.
 */
const generateTokens = (user, profileName) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: profileName, trust_score: user.trust_score, onboarding_completed: user.onboarding_completed },
    ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  )

  const refreshToken = jwt.sign(
    { id: user.id },
    REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  )

  return { accessToken, refreshToken }
}

// ============================================================================
// SIGNUP FLOW (5 STEPS)
// ============================================================================

/**
 * Step 1: Initiate signup, send email OTP
 */
export const signup = async (req, res, next) => {
  try {
    const { email } = req.body
    
    // Check if user already exists and is fully registered
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser && existingUser.onboarding_completed) {
      return next(new AppError('An account is already registered with this email address.', 409, 'EMAIL_TAKEN'))
    }

    // Verify email format
    if (!isValidEmail(email)) {
      return next(new AppError('Please enter a valid email address.', 400, 'INVALID_EMAIL'))
    }

    // Send/Cache Email OTP
    const code = await generateEmailOTP(email)

    // Send verification email — if provider fails, surface the real error immediately
    try {
      await sendOTPEmail(email, code)
    } catch (emailErr) {
      logger.error(`Failed sending OTP email to ${email}: ${emailErr.message}`)
      return next(new AppError(`Email delivery failed: ${emailErr.message}`, 500, 'EMAIL_DELIVERY_FAILED'))
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to email successfully.'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Step 2: Verify email OTP
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body
    const isValid = await verifyEmailOTP(email, code)

    if (!isValid) {
      return next(new AppError('Invalid or expired verification code.', 400, 'INVALID_OTP'))
    }

    res.status(200).json({
      success: true,
      message: 'Email address successfully verified.'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Step 3: Initiate phone verification, send Twilio SMS OTP
 */
export const verifyPhone = async (req, res, next) => {
  try {
    const { email, phone } = req.body

    const targetEmail = (email || req.user?.email || '').toLowerCase().trim()
    const existingPhone = await User.findOne({ where: { phone, onboarding_completed: true } })
    if (existingPhone && targetEmail && existingPhone.email !== targetEmail) {
      return next(new AppError('Phone number is already associated with another account.', 409, 'PHONE_TAKEN'))
    }

    await sendPhoneOTP(phone)

    res.status(200).json({
      success: true,
      message: 'Verification code sent to phone via SMS.'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Step 4: Verify phone SMS OTP
 */
export const verifyPhoneCheck = async (req, res, next) => {
  try {
    const { phone, code } = req.body
    const isValid = await verifyPhoneOTP(phone, code)

    if (!isValid) {
      return next(new AppError('Invalid or expired phone verification code.', 400, 'INVALID_PHONE_OTP'))
    }

    res.status(200).json({
      success: true,
      message: 'Phone number successfully verified.'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Step 5: Complete signup, hash password, create records and log in
 */
export const completeSignup = async (req, res, next) => {
  try {
    const { email, password, name, gender, city_id, interest_tags } = req.body
    const normalizedEmail = email.toLowerCase().trim()

    // Enforce check
    const existingUser = await User.findOne({ where: { email: normalizedEmail } })
    if (existingUser && existingUser.onboarding_completed) {
      return next(new AppError('User registration already completed.', 400, 'SIGNUP_COMPLETED'))
    }

    // 1. Hash password with bcrypt work factor 12
    const passwordHash = await bcrypt.hash(password, 12)

    // Resolve & validate city_id to guarantee FK constraint integrity
    let validCityId = city_id
    if (validCityId) {
      let cityRecord = await City.findByPk(validCityId)
      if (!cityRecord) {
        const defaultMatch = DEFAULT_CITIES.find(
          c => c.id === validCityId || c.city_name.toLowerCase() === String(validCityId).toLowerCase()
        )
        if (defaultMatch) {
          try {
            cityRecord = await City.create(defaultMatch, { ignoreDuplicates: true })
            validCityId = cityRecord.id
          } catch (e) {
            const recheck = await City.findByPk(defaultMatch.id)
            validCityId = recheck ? recheck.id : defaultMatch.id
          }
        } else {
          const firstCity = await City.findOne({ where: { is_active: true } })
          if (firstCity) {
            validCityId = firstCity.id
          } else {
            await City.seedDefaultsIfNeeded()
            validCityId = DEFAULT_CITIES[2].id // Bengaluru
          }
        }
      }
    } else {
      const firstCity = await City.findOne({ where: { is_active: true } })
      if (firstCity) {
        validCityId = firstCity.id
      } else {
        await City.seedDefaultsIfNeeded()
        validCityId = DEFAULT_CITIES[2].id // Bengaluru
      }
    }

    let user = existingUser
    if (user) {
      // Update stub account
      user.password_hash = passwordHash
      user.city_id = validCityId
      user.interest_tags = interest_tags || []
      user.onboarding_completed = false
      user.tos_accepted_at = new Date()
      await user.save()
    } else {
      // Create new account
      user = await User.create({
        email: normalizedEmail,
        password_hash: passwordHash,
        city_id: validCityId,
        interest_tags: interest_tags || [],
        onboarding_completed: false,
        is_phone_verified: true, // Set from previous validation step
        account_status: 'active',
        tos_accepted_at: new Date()
      })
    }

    // 2. Create Profile
    let profile = await Profile.findOne({ where: { user_id: user.id } })
    if (profile) {
      profile.name = name
      profile.gender = gender
      await profile.save()
    } else {
      profile = await Profile.create({
        user_id: user.id,
        name,
        gender
      })
    }

    // 3. Create default Notification Preferences
    await NotificationPreference.findOrCreate({
      where: { user_id: user.id },
      defaults: {
        new_activities: true,
        trip_updates: true,
        join_updates: true,
        score_changes: true,
        social: true
      }
    })

    // 4. Generate Session tokens
    const { accessToken, refreshToken } = generateTokens(user, profile.name)

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

    logger.info(`User registration complete: ${normalizedEmail}`)

    res.status(201).json({
      success: true,
      message: 'Account successfully registered and authenticated.',
      accessToken,
      user: {
        id: user.id,
        name: profile.name,
        email: user.email,
        role: user.role,
        trustScore: user.trust_score,
        onboardingCompleted: user.onboarding_completed
      }
    })
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// LOGIN / LOGOUT & SESSION MANAGEMENT
// ============================================================================

/**
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = email.toLowerCase().trim()

    // 1. Fetch user by email
    const user = await User.findOne({ where: { email: normalizedEmail } })
    if (!user || !user.password_hash) {
      // Timing-attack mitigation: run dummy compare on non-existent users
      await bcrypt.compare(password, DUMMY_HASH)
      return next(new AppError('Invalid email address or password.', 401, 'INVALID_CREDENTIALS'))
    }

    // Check account lockout status
    if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
      // Run dummy compare to maintain constant response timing
      await bcrypt.compare(password, DUMMY_HASH)
      return next(new AppError('Invalid email address or password.', 401, 'INVALID_CREDENTIALS'))
    }

    // 2. Check password hash
    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1
      if (user.failed_login_attempts >= 5) {
        user.lockout_until = new Date(Date.now() + 15 * 60 * 1000) // 15 mins lock
      }
      await user.save()
      return next(new AppError('Invalid email address or password.', 401, 'INVALID_CREDENTIALS'))
    }

    // Reset attempts on successful login
    user.failed_login_attempts = 0
    user.lockout_until = null
    await user.save()

    // 3. Verify Account Status
    if (user.account_status === 'banned') {
      return next(new AppError(`Account banned. Reason: ${user.ban_reason || 'Terms violation'}`, 403, 'USER_BANNED'))
    }

    if (user.account_status === 'suspended') {
      if (user.suspension_until && new Date() < new Date(user.suspension_until)) {
        return next(new AppError('This account is suspended.', 403, 'USER_SUSPENDED'))
      } else {
        user.account_status = 'active'
        user.suspension_until = null
        await user.save()
      }
    }

    // 4. Retrieve Profile Name
    const profile = await Profile.findOne({ where: { user_id: user.id } })
    const profileName = profile ? profile.name : 'Traveler'

    // 5. Generate and Set tokens
    const { accessToken, refreshToken } = generateTokens(user, profileName)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

    logger.info(`User logged in: ${normalizedEmail}`)

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      user: {
        id: user.id,
        name: profileName,
        email: user.email,
        role: user.role,
        trustScore: user.trust_score,
        onboardingCompleted: user.onboarding_completed
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Silent JWT Access token refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies

    if (!refreshToken) {
      return next(new AppError('Refresh token missing from cookies.', 401, 'REFRESH_TOKEN_MISSING'))
    }

    // Hash refresh token to verify it has not been reused (blacklisted)
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
    const isBlacklisted = await TokenBlacklist.findOne({ where: { token_hash: tokenHash } })
    if (isBlacklisted) {
      logger.warn(`Detecting reused/blacklisted refresh token hash: ${tokenHash}`)
      return next(new AppError('Session expired: Invalid or reused refresh token. Please login again.', 401, 'REFRESH_TOKEN_REUSED'))
    }

    // Verify token
    let decoded
    try {
      decoded = jwt.verify(refreshToken, REFRESH_SECRET)
    } catch (err) {
      return next(new AppError('Refresh token expired or invalid. Please login again.', 401, 'REFRESH_TOKEN_EXPIRED'))
    }

    // Fetch user and profile
    const user = await User.findByPk(decoded.id)
    if (!user || user.account_status !== 'active') {
      return next(new AppError('User not found or account is restricted.', 401, 'USER_RESTRICTED'))
    }

    const profile = await Profile.findOne({ where: { user_id: user.id } })
    const profileName = profile ? profile.name : 'Traveler'

    // Blacklist the old refresh token
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await TokenBlacklist.create({
      token_hash: tokenHash,
      user_id: user.id,
      expires_at: expiresAt
    })

    // Issue fresh tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user, profileName)
    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS)

    logger.debug(`Successfully refreshed Access Token and rotated Refresh Token for User: ${user.email}`)

    res.status(200).json({
      success: true,
      accessToken
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Logout user: Blacklists active token and clears HTTP cookie
 */
export const logout = async (req, res, next) => {
  try {
    const token = req.token

    if (token) {
      // Hash access token for blacklisting
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      const decoded = jwt.decode(token)
      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000)

      await TokenBlacklist.create({
        token_hash: tokenHash,
        user_id: req.user.id,
        expires_at: expiresAt
      })
      logger.info(`Blacklisted access token hash for logged-out user: ${req.user?.email}`)
    }

    // Clear refresh cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    })

    res.status(200).json({
      success: true,
      message: 'Log out successful.'
    })
  } catch (error) {
    next(error)
  }
}

// ============================================================================
// PASSWORD RECOVERY FLOW
// ============================================================================

/**
 * Initiate password recovery: sends reset link email
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ where: { email: email.toLowerCase().trim() } })

    if (!user) {
      // Return 200 to prevent user enumeration security disclosure
      return res.status(200).json({
        success: true,
        message: 'If the email matches a registered account, a password reset link has been sent.'
      })
    }

    // Generate recovery reset token (JWT encoding target)
    const resetToken = jwt.sign({ id: user.id, type: 'reset' }, RESET_SECRET, { expiresIn: '15m' })

    await sendResetPasswordEmail(user.email, resetToken)

    res.status(200).json({
      success: true,
      message: 'If the email matches a registered account, a password reset link has been sent.'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Complete password reset using token link
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body

    // 1. Verify Reset JWT
    let decoded
    try {
      decoded = jwt.verify(token, RESET_SECRET)
      if (decoded.type !== 'reset') {
        return next(new AppError('Invalid password reset token.', 400, 'INVALID_RESET_TOKEN'))
      }
    } catch (err) {
      return next(new AppError('Reset link has expired or is invalid. Please request a new link.', 400, 'EXPIRED_RESET_TOKEN'))
    }

    // 2. Fetch User and update password hash
    const user = await User.findByPk(decoded.id)
    if (!user) {
      return next(new AppError('User no longer exists.', 404, 'USER_NOT_FOUND'))
    }

    const passwordHash = await bcrypt.hash(password, 12)
    user.password_hash = passwordHash
    await user.save()

    logger.info(`Password successfully reset for user: ${user.email}`)

    res.status(200).json({
      success: true,
      message: 'Password successfully reset. You can now log in.'
    })
  } catch (error) {
    next(error)
  }
}
