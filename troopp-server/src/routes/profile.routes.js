import { Router } from 'express'
import { Op } from 'sequelize'
import { authGuard } from '../middleware/auth.middleware.js'
import User from '../models/User.js'
import Profile from '../models/Profile.js'
import EmergencyContact from '../models/EmergencyContact.js'
import Follow from '../models/Follow.js'
import ActivityMember from '../models/ActivityMember.js'
import City, { DEFAULT_CITIES } from '../models/City.js'
import { AppError } from '../middleware/errorHandler.middleware.js'
import ReliabilityScoreLog from '../models/ReliabilityScoreLog.js'
import logger from '../config/logger.js'
import { uploadSingle } from '../middleware/upload.middleware.js'
import { uploadToCloudinary } from '../config/cloudinary.js'
import { validate, updateProfileSchema } from '../middleware/validate.js'
import { generateTokens, COOKIE_OPTIONS } from '../controllers/auth.controller.js'
import sequelize from '../config/db.js'

const router = Router()

const sanitizeHTML = (str) => {
  if (typeof str !== 'string') return str
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Protect all profile actions
router.use(authGuard)

/**
 * POST /api/v1/profiles/complete-onboarding
 * Marks the user profile onboarding flow completed.
 */
router.post('/complete-onboarding', async (req, res, next) => {
  try {
    const userId = req.user.id
    const user = await User.findByPk(userId, {
      include: [{ model: Profile, as: 'Profile' }]
    })
    if (!user) {
      return next(new AppError('User account not found.', 404, 'USER_NOT_FOUND'))
    }

    // 1. Verify profile details
    if (!user.Profile) {
      return next(new AppError('Profile record not created yet.', 400, 'ONBOARDING_INCOMPLETE_PROFILE'))
    }

    const { bio, gender } = user.Profile
    if (!bio || bio.trim().length < 10) {
      return next(new AppError('A valid bio (minimum 10 characters) is required to complete onboarding.', 400, 'ONBOARDING_INCOMPLETE_BIO'))
    }

    if (!gender || !['male', 'female', 'non-binary', 'other', 'prefer_not_to_say'].includes(gender.toLowerCase())) {
      return next(new AppError('Gender selection is required to complete onboarding.', 400, 'ONBOARDING_INCOMPLETE_GENDER'))
    }

    // 2. Verify interest tags count and validation
    if (!user.interest_tags || user.interest_tags.length < 3) {
      return next(new AppError('Please select at least 3 interest tags to complete onboarding.', 400, 'ONBOARDING_INCOMPLETE_INTERESTS'))
    }
    const validTags = ['Trekking', 'Camping', 'Photography Walk', 'Road Trips', 'Night Drives', 'Cycling', 'Heritage Walks', 'Day Trips']
    const hasInvalidTags = user.interest_tags.some(tag => !validTags.includes(tag))
    if (hasInvalidTags) {
      return next(new AppError('Interest tags contain invalid categories.', 400, 'ONBOARDING_INVALID_INTERESTS'))
    }

    // 3. Verify emergency contact list (at least one contact must exist)
    const contactsCount = await EmergencyContact.count({ where: { user_id: userId } })
    if (contactsCount === 0) {
      return next(new AppError('At least one emergency contact is required to complete onboarding.', 400, 'ONBOARDING_INCOMPLETE_EMERGENCY'))
    }

    user.onboarding_completed = true
    await user.save()

    const profile = await Profile.findOne({ where: { user_id: user.id } })
    const profileName = profile ? profile.name : 'Traveler'
    const { accessToken, refreshToken } = generateTokens(user, profileName)
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

    logger.info(`Onboarding completed for user: ${user.email}`)

    res.status(200).json({
      success: true,
      message: 'Profile onboarding successfully completed.',
      accessToken,
      user: {
        id: user.id,
        name: profileName,
        email: user.email,
        role: user.role,
        trustScore: user.trust_score,
        onboardingCompleted: true
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/profiles/me/avatar
 * Uploads a profile avatar photo using Multer and saves to Cloudinary.
 */
router.post('/me/avatar', uploadSingle('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No avatar file was uploaded.', 400, 'FILE_MISSING'))
    }

    const userId = req.user.id
    let profile = await Profile.findOne({ where: { user_id: userId } })
    if (!profile) {
      profile = await Profile.create({
        user_id: userId,
        name: req.user.email ? req.user.email.split('@')[0] : 'Traveler',
        gender: 'prefer_not_to_say'
      })
    }

    // Upload to Cloudinary under 'avatars' folder
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'avatars',
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' }
      ]
    })

    // Update avatar url in the database
    profile.avatar_url = uploadResult.secure_url
    await profile.save()

    logger.info(`Profile avatar updated for user: ${userId} to URL: ${uploadResult.secure_url}`)

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully.',
      data: {
        avatarUrl: profile.avatar_url
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/v1/profiles/search/members
 * Searches for users/profiles by name.
 */
router.get('/search/members', async (req, res, next) => {
  try {
    const { q } = req.query
    if (!q || !q.trim()) {
      return res.status(200).json({ success: true, data: [] })
    }
    const users = await User.findAll({
      include: [{
        model: Profile,
        as: 'Profile',
        where: {
          name: {
            [Op.iLike]: `%${q.trim()}%`
          }
        }
      }],
      limit: 10
    })
    const formatted = users.map(u => ({
      id: u.id,
      name: u.Profile?.name || 'Explorer',
      avatar_url: u.Profile?.avatar_url,
      trust_score: u.trust_score
    }))
    res.status(200).json({ success: true, data: formatted })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/v1/profiles/me
 * Retrieves current user's profile and user status fields.
 */
router.get('/me', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Profile, as: 'Profile' }]
    })

    if (!user) {
      return next(new AppError('User profile not found.', 404, 'PROFILE_NOT_FOUND'))
    }

    let profile = user.Profile
    if (!profile) {
      profile = await Profile.create({
        user_id: user.id,
        name: user.email ? user.email.split('@')[0] : 'Traveler',
        gender: 'prefer_not_to_say',
        bio: ''
      })
    }

    const emergencyContacts = await EmergencyContact.findAll({
      where: { user_id: req.user.id }
    })

    const completedTrips = await ActivityMember.count({
      where: { user_id: req.user.id }
    })

    const noShows = await ReliabilityScoreLog.count({
      where: { user_id: req.user.id, reason: 'no_show' }
    })

    const lateCancellations = await ReliabilityScoreLog.count({
      where: { user_id: req.user.id, reason: 'late_withdrawal' }
    })

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        trustScore: user.trust_score,
        reliabilityScore: user.reliability_score,
        onboardingCompleted: user.onboarding_completed,
        isPhoneVerified: user.is_phone_verified,
        interestTags: user.interest_tags || [],
        cityId: user.city_id,
        profile: user.Profile,
        emergencyContacts,
        reliabilityBreakdown: {
          completedTrips,
          noShows,
          lateCancellations
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/v1/profiles/emergency-contacts
 * Returns the list of registered emergency numbers.
 */
router.get('/emergency-contacts', async (req, res, next) => {
  try {
    const contacts = await EmergencyContact.findAll({
      where: { user_id: req.user.id }
    })
    res.status(200).json({
      success: true,
      data: contacts
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/profiles/emergency-contacts
 * Appends a new contact record.
 */
router.post('/emergency-contacts', async (req, res, next) => {
  const transaction = await sequelize.transaction()
  try {
    const { name, phone, relationship } = req.body
    if (!name || !phone || !relationship) {
      await transaction.rollback()
      return next(new AppError('Name, phone, and relationship are required fields.', 400, 'MISSING_FIELDS'))
    }

    // Validate phone number format (E.164 pattern: +91 followed by 10 digits starting with 6-9)
    const phoneRegex = /^\+91[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      await transaction.rollback()
      return next(new AppError('Invalid phone number format. Must be a valid Indian phone number (+91XXXXXXXXXX).', 400, 'INVALID_PHONE_FORMAT'))
    }

    // Name validation
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 150) {
      await transaction.rollback()
      return next(new AppError('Contact name must be a string between 2 and 150 characters.', 400, 'INVALID_NAME'))
    }

    // Relationship validation
    if (typeof relationship !== 'string' || relationship.trim().length < 2 || relationship.trim().length > 100) {
      await transaction.rollback()
      return next(new AppError('Relationship must be a string between 2 and 100 characters.', 400, 'INVALID_RELATIONSHIP'))
    }

    // Because database model has `unique: true` for user_id, we check if one already exists
    // to do an update/upsert and prevent constraint errors.
    let contact = await EmergencyContact.findOne({ where: { user_id: req.user.id }, transaction })
    const isNew = !contact

    if (!isNew) {
      contact.name = name.trim()
      contact.phone = phone
      contact.relationship = relationship.trim()
      await contact.save({ transaction })
      logger.info(`Emergency contact updated for user ${req.user.id}: ${contact.name}`)
    } else {
      contact = await EmergencyContact.create({
        user_id: req.user.id,
        name: name.trim(),
        phone,
        relationship: relationship.trim()
      }, { transaction })
      logger.info(`Emergency contact created for user ${req.user.id}: ${contact.name}`)
    }

    await transaction.commit()

    // Only reward trust points on the very first emergency contact creation
    if (isNew) {
      try {
        const { addTrustScore } = await import('../modules/trust/trust.service.js')
        await addTrustScore(req.user.id, 10, 'emergency_contact')
      } catch (err) {
        logger.error(`Failed adding emergency contact trust score bonus for user ${req.user.id}:`, err)
      }
    }

    res.status(isNew ? 201 : 200).json({
      success: true,
      data: contact
    })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
})

/**
 * DELETE /api/v1/profiles/emergency-contacts/:id
 * Removals trigger.
 */
router.delete('/emergency-contacts/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const contact = await EmergencyContact.findOne({
      where: { id, user_id: req.user.id }
    })

    if (!contact) {
      return next(new AppError('Contact not found or access denied.', 404, 'CONTACT_NOT_FOUND'))
    }

    await contact.destroy()
    logger.info(`Emergency contact destroyed: ${id}`)

    const countRemaining = await EmergencyContact.count({ where: { user_id: req.user.id } })
    if (countRemaining === 0) {
      try {
        const { deductTrustScore } = await import('../modules/trust/trust.service.js')
        await deductTrustScore(req.user.id, 10, 'emergency_contact')
      } catch (err) {
        logger.error(`Failed deducting emergency contact trust score penalty for user ${req.user.id}:`, err)
      }
    }

    res.status(200).json({
      success: true,
      message: 'Emergency contact successfully removed.'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/profiles/verify-phone
 * Initiates phone verification by sending OTP SMS to the specified number.
 */
router.post('/verify-phone', async (req, res, next) => {
  try {
    const { phone } = req.body
    if (!phone) {
      return next(new AppError('Phone number is required.', 400, 'PHONE_REQUIRED'))
    }

    // Validate phone number format (E.164 pattern: +91 followed by 10 digits starting with 6-9)
    const phoneRegex = /^\+91[6-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      return next(new AppError('Invalid phone number format. Must be a valid Indian phone number (+91XXXXXXXXXX).', 400, 'INVALID_PHONE_FORMAT'))
    }

    // Check if phone number is already taken by another account
    const existingUser = await User.findOne({ where: { phone, onboarding_completed: true } })
    if (existingUser && existingUser.id !== req.user.id) {
      return next(new AppError('Phone number is already associated with another account.', 409, 'PHONE_TAKEN'))
    }

    const { sendPhoneOTP } = await import('../services/otp.service.js')
    await sendPhoneOTP(phone)

    res.status(200).json({
      success: true,
      message: 'Verification code sent to phone via SMS.'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/profiles/verify-phone/check
 * Verifies phone OTP code and updates the user's phone status.
 */
router.post('/verify-phone/check', async (req, res, next) => {
  try {
    const { phone, code } = req.body
    if (!phone || !code) {
      return next(new AppError('Phone number and verification code are required.', 400, 'MISSING_FIELDS'))
    }

    const { verifyPhoneOTP } = await import('../services/otp.service.js')
    const isValid = await verifyPhoneOTP(phone, code)

    if (!isValid) {
      return next(new AppError('Invalid or expired phone verification code.', 400, 'INVALID_PHONE_OTP'))
    }

    // Update user record
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return next(new AppError('User profile not found.', 404, 'PROFILE_NOT_FOUND'))
    }

    const isNewVerification = !user.is_phone_verified
    user.phone = phone
    user.is_phone_verified = true
    await user.save()

    if (isNewVerification) {
      try {
        const { addTrustScore } = await import('../modules/trust/trust.service.js')
        await addTrustScore(req.user.id, 20, 'phone_verified')
      } catch (err) {
        logger.error(`Failed adding phone verification trust score bonus for user ${req.user.id}:`, err)
      }
    }

    res.status(200).json({
      success: true,
      message: 'Phone number successfully verified.'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/v1/profiles/:userId
 * Retrieves another traveler's public profile dynamically.
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params
    const targetUser = await User.findByPk(userId, {
      include: [{ model: Profile, as: 'Profile' }]
    })

    if (!targetUser) {
      return next(new AppError('Traveler profile not found.', 404, 'USER_NOT_FOUND'))
    }

    // Query dynamic counts from database associations
    const followersCount = await Follow.count({ where: { following_id: userId } })
    const followingCount = await Follow.count({ where: { follower_id: userId } })

    const isFollowing = await Follow.findOne({
      where: { follower_id: req.user.id, following_id: userId }
    })

    const tripsCompleted = await ActivityMember.count({
      where: { user_id: userId }
    })

    // Check if requesting user shares a confirmed activity with target user
    let sharesConfirmedTrip = false
    if (req.user && req.user.id !== userId) {
      const reqUserActivities = await ActivityMember.findAll({
        where: {
          user_id: req.user.id,
          status: 'confirmed'
        },
        attributes: ['activity_id'],
        raw: true
      })
      const activityIds = reqUserActivities.map(m => m.activity_id)

      if (activityIds.length > 0) {
        const sharedMember = await ActivityMember.findOne({
          where: {
            activity_id: activityIds,
            user_id: userId,
            status: 'confirmed'
          }
        })
        if (sharedMember) {
          sharesConfirmedTrip = true
        }
      }
    }

    const isAuthorizedForEmergency = (req.user && req.user.id === userId) || sharesConfirmedTrip

    const emergencyContacts = isAuthorizedForEmergency
      ? await EmergencyContact.findAll({ where: { user_id: userId } })
      : null

    const noShows = await ReliabilityScoreLog.count({
      where: { user_id: userId, reason: 'no_show' }
    })

    const lateCancellations = await ReliabilityScoreLog.count({
      where: { user_id: userId, reason: 'late_withdrawal' }
    })

    res.status(200).json({
      success: true,
      data: {
        userId: targetUser.id,
        name: targetUser.Profile?.name || 'Explorer',
        bio: targetUser.Profile?.bio || '',
        avatarUrl: targetUser.Profile?.avatar_url || '',
        trustScore: targetUser.trust_score,
        reliabilityScore: targetUser.reliability_score,
        isPhoneVerified: targetUser.is_phone_verified,
        gender: targetUser.Profile?.gender || '',
        followersCount,
        followingCount,
        tripsCompleted,
        isFollowing: !!isFollowing,
        isAuthorizedForEmergency,
        emergencyContacts,
        reliabilityBreakdown: {
          completedTrips: tripsCompleted,
          noShows,
          lateCancellations
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/v1/profiles/me
 * Updates profile properties (name, bio, gender, interest tags).
 */
router.put('/me', validate(updateProfileSchema), async (req, res, next) => {
  const transaction = await sequelize.transaction()
  try {
    const { name, bio, gender, interestTags, cityId } = req.body
    const userId = req.user.id

    const user = await User.findByPk(userId, { transaction })
    if (!user) {
      await transaction.rollback()
      return next(new AppError('User account not found.', 404, 'USER_NOT_FOUND'))
    }

    let profile = await Profile.findOne({ where: { user_id: userId }, transaction })
    if (!profile) {
      profile = await Profile.create({
        user_id: userId,
        name: name ? sanitizeHTML(name.trim()) : (user.email ? user.email.split('@')[0] : 'Traveler'),
        gender: gender || 'prefer_not_to_say',
        bio: bio !== undefined ? sanitizeHTML(bio.trim()) : ''
      }, { transaction })
    }

    let userChanged = false
    if (interestTags) {
      user.interest_tags = interestTags
      userChanged = true
    }
    if (cityId) {
      let cityRecord = await City.findByPk(cityId, { transaction })
      if (!cityRecord) {
        const defaultMatch = DEFAULT_CITIES.find(
          c => c.id === cityId || c.city_name.toLowerCase() === String(cityId).toLowerCase()
        )
        if (defaultMatch) {
          try {
            await City.create(defaultMatch, { transaction, ignoreDuplicates: true })
          } catch (e) {
            // Ignore race condition duplicate error
          }
        }
      }
      user.city_id = cityId
      userChanged = true
    }
    if (userChanged) {
      await user.save({ transaction })
    }

    if (name) profile.name = sanitizeHTML(name.trim())
    if (bio !== undefined) profile.bio = sanitizeHTML(bio.trim())
    if (gender) profile.gender = gender

    await profile.save({ transaction })

    await transaction.commit()

    logger.info(`Profile updated for user: ${user.email}`)

    res.status(200).json({
      success: true,
      message: 'Profile successfully updated.',
      data: {
        id: user.id,
        email: user.email,
        trustScore: user.trust_score,
        reliabilityScore: user.reliability_score,
        interestTags: user.interest_tags,
        profile
      }
    })
  } catch (error) {
    await transaction.rollback()
    next(error)
  }
})

export default router
