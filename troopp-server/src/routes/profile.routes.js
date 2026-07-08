import { Router } from 'express'
import { authGuard } from '../middleware/auth.middleware.js'
import User from '../models/User.js'
import Profile from '../models/Profile.js'
import EmergencyContact from '../models/EmergencyContact.js'
import Follow from '../models/Follow.js'
import ActivityMember from '../models/ActivityMember.js'
import { AppError } from '../middleware/errorHandler.middleware.js'
import logger from '../config/logger.js'

const router = Router()

// Protect all profile actions
router.use(authGuard)

/**
 * POST /api/v1/profiles/complete-onboarding
 * Marks the user profile onboarding flow completed.
 */
router.post('/complete-onboarding', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return next(new AppError('User account not found.', 404, 'USER_NOT_FOUND'))
    }
    user.onboarding_completed = true
    await user.save()

    logger.info(`Onboarding completed for user: ${user.email}`)

    res.status(200).json({
      success: true,
      message: 'Profile onboarding successfully completed.'
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/v1/profiles/me
 * Retrieves current user's profile and user status fields.
 */
router.get('/me', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Profile }]
    })

    if (!user) {
      return next(new AppError('User profile not found.', 404, 'PROFILE_NOT_FOUND'))
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        trustScore: user.trust_score,
        reliabilityScore: user.reliability_score,
        idVerified: user.is_id_verified,
        onboardingCompleted: user.onboarding_completed,
        interestTags: user.interest_tags || [],
        profile: user.Profile
      }
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
      include: [{ model: Profile }]
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

    res.status(200).json({
      success: true,
      data: {
        userId: targetUser.id,
        name: targetUser.Profile?.name || 'Explorer',
        bio: targetUser.Profile?.bio || '',
        avatarUrl: targetUser.Profile?.avatar_url || '',
        trustScore: targetUser.trust_score,
        reliabilityScore: targetUser.reliability_score,
        followersCount,
        followingCount,
        tripsCompleted,
        isFollowing: !!isFollowing,
        idVerified: targetUser.is_id_verified
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
router.put('/me', async (req, res, next) => {
  try {
    const { name, bio, gender, interestTags } = req.body
    const userId = req.user.id

    const user = await User.findByPk(userId)
    const profile = await Profile.findOne({ where: { user_id: userId } })

    if (!user || !profile) {
      return next(new AppError('Profile record not found.', 404, 'PROFILE_NOT_FOUND'))
    }

    if (interestTags) {
      user.interest_tags = interestTags
      await user.save()
    }

    if (name) profile.name = name
    if (bio !== undefined) profile.bio = bio
    if (gender) profile.gender = gender

    await profile.save()

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
  try {
    const { name, phone, relationship } = req.body
    if (!name || !phone || !relationship) {
      return next(new AppError('Name, phone, and relationship are required fields.', 400, 'MISSING_FIELDS'))
    }

    // Capped at 5 contacts max to prevent spam
    const count = await EmergencyContact.count({ where: { user_id: req.user.id } })
    if (count >= 5) {
      return next(new AppError('Maximum of 5 emergency contacts permitted.', 400, 'CONTACT_LIMIT_REACHED'))
    }

    const contact = await EmergencyContact.create({
      user_id: req.user.id,
      name,
      phone,
      relationship
    })

    logger.info(`Emergency contact added for user ${req.user.id}: ${name}`)

    if (count === 0) {
      try {
        const { addTrustScore } = await import('../modules/trust/trust.service.js')
        await addTrustScore(req.user.id, 10, 'emergency_contact')
      } catch (err) {
        logger.error(`Failed adding emergency contact trust score bonus for user ${req.user.id}:`, err)
      }
    }

    res.status(201).json({
      success: true,
      data: contact
    })
  } catch (error) {
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

export default router
