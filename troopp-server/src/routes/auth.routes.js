import { Router } from 'express'
import passport from 'passport'
import jwt from 'jsonwebtoken'

import * as authController from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import * as schemas from '../middleware/validate.js'
import * as limits from '../middleware/rateLimit.middleware.js'
import logger from '../config/logger.js'

const router = Router()

// ============================================================================
// 1. REGISTRATION SIGNUP ENDPOINTS (5 STEPS)
// ============================================================================

// Step 1: Initiate signup, send email OTP
router.post('/signup', limits.authSignupLimiter, validate(schemas.signupSchema), authController.signup)

// Step 2: Verify email verification code
router.post('/verify-email', validate(schemas.verifyEmailSchema), authController.verifyEmail)

// Step 3: Send phone SMS OTP via Twilio Verify
router.post('/verify-phone', limits.otpSendLimiter, validate(schemas.verifyPhoneSchema), authController.verifyPhone)

// Step 4: Verify SMS verification code
router.post('/verify-phone/check', validate(schemas.verifyPhoneCheckSchema), authController.verifyPhoneCheck)

// Step 5: Complete signup, create profile database records
router.post('/complete-signup', validate(schemas.completeSignupSchema), authController.completeSignup)

// ============================================================================
// 2. SESSION & COOKIE MANAGEMENT (LOGIN, LOGOUT, SILENT REFRESH)
// ============================================================================

// Standard User Login
router.post('/login', limits.authLoginLimiter, validate(schemas.loginSchema), authController.login)

// Silent Token Refresh (checks refresh HttpOnly cookie)
router.post('/refresh', authController.refresh)

// User Logout (revokes active Access Token)
router.post('/logout', protect, authController.logout)

// ============================================================================
// 3. PASSWORD RECOVERY / FORGOT PASSWORDS
// ============================================================================

// Send reset token password email
router.post('/forgot-password', limits.otpSendLimiter, validate(schemas.forgotPasswordSchema), authController.forgotPassword)

// Change password using verification token
router.post('/reset-password', validate(schemas.resetPasswordSchema), authController.resetPassword)

// ============================================================================
// 4. SOCIAL AUTHENTICATION (Google OAuth 2.0 via Passport)
// ============================================================================

// Trigger Google OAuth sign-in flow
router.get('/google', (req, res, next) => {
  // Check if passport strategy is active (initialized in passport.js)
  const isPassportConfigured = passport._strategies?.google
  if (!isPassportConfigured) {
    logger.warn('Google sign-in attempted but strategy is unconfigured.')
    return res.status(503).json({
      success: false,
      error: { code: 'OAUTH_DISABLED', message: 'Google Sign-In is temporarily unavailable.' }
    })
  }
  next()
}, passport.authenticate('google', { scope: ['profile', 'email'], session: false }))

// Google OAuth callback endpoint
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=OAuthFailed`, session: false }),
  async (req, res) => {
    try {
      const user = req.user
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=OAuthFailed`)
      }

      // Fetch user profile name
      const profile = await user.getProfile()
      const profileName = profile ? profile.name : 'Traveler'

      // Generate Access token & Refresh token cookie
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: profileName, trust_score: user.trust_score },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
      )

      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
      )

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      })

      // Redirect client to callback catcher, passing the short-lived access token
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/google/callback?token=${accessToken}&onboarded=${user.onboarding_completed}`
      res.redirect(redirectUrl)
    } catch (err) {
      logger.error('Google OAuth callback handler failed:', err)
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=OAuthHandlerError`)
    }
  }
)

export default router
