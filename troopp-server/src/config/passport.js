import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import User from '../models/User.js'
import Profile from '../models/Profile.js'
import logger from './logger.js'

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env

const isValidCollegeEmail = (email) => {
  if (!email) return false
  const domain = email.split('@')[1]?.toLowerCase().trim()
  if (!domain) return false

  // Standard college domains
  if (
    domain === 'edu' ||
    domain === 'ac.in' ||
    domain === 'edu.in' ||
    domain.endsWith('.edu') ||
    domain.endsWith('.ac.in') ||
    domain.endsWith('.edu.in')
  ) {
    return true
  }

  // Development bypass list
  if (process.env.NODE_ENV !== 'production') {
    const devDomains = ['troopp.com', 'example.com', 'gmail.com', 'test.com']
    if (devDomains.includes(domain)) {
      return true
    }
  }

  return false
}

const initPassport = () => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    logger.warn('Google OAuth keys are not configured. Google Sign-In is disabled.')
    return
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value
          const googleId = profile.id

          if (!email) {
            return done(new Error('Google profile did not return an email address.'), null)
          }

          if (!isValidCollegeEmail(email)) {
            return done(new Error('Please login with an approved college email address ending with .edu or .ac.in.'), null)
          }

          // 1. Search by Google ID
          let user = await User.findOne({ where: { google_id: googleId } })
          if (user) {
            return done(null, user)
          }

          // 2. Search by Email to link Google account
          user = await User.findOne({ where: { email: email.toLowerCase().trim() } })
          if (user) {
            user.google_id = googleId
            await user.save()
            return done(null, user)
          }

          // 3. Register a new user stub for Google signups
          // Note: Since onboarding is a distinct step, this creates an un-onboarded user stub
          user = await User.create({
            email: email.toLowerCase().trim(),
            google_id: googleId,
            is_phone_verified: false, // Must verify phone on complete-signup onboarding
            trust_score: 50, // Initial default score
            account_status: 'active',
            onboarding_completed: false,
          })

          // Create Profile association
          await Profile.create({
            user_id: user.id,
            name: profile.displayName || 'Google User',
            avatar_url: profile.photos?.[0]?.value || null,
            gender: 'prefer_not_to_say',
          })

          logger.info(`Registered new Google OAuth user stub: ${email}`)
          return done(null, user)
        } catch (error) {
          logger.error('Google Strategy OAuth authentication failed:', error)
          return done(error, null)
        }
      }
    )
  )

  // Serialize/Deserialize handlers for express-session (if active)
  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id)
      done(null, user)
    } catch (err) {
      done(err, null)
    }
  })

  logger.info('Passport Google OAuth Strategy successfully configured.')
}

export default initPassport
