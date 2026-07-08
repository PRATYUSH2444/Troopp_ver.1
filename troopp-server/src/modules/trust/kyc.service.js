import axios from 'axios'
import FormData from 'form-data'
import { CompareFacesCommand } from '@aws-sdk/client-rekognition'

import User from '../../models/User.js'
import { encrypt } from '../../utils/encryption.js'
import { uploadToCloudinary } from '../../config/cloudinary.js'
import { rekognitionClient } from '../../config/rekognition.js'
import { addTrustScore } from './trust.service.js'
import { sendNotification } from '../../services/notification.service.js'
import logger from '../../config/logger.js'
import { AppError } from '../../middleware/errorHandler.middleware.js'

const {
  DIGIO_CLIENT_ID,
  DIGIO_CLIENT_SECRET,
  DIGIO_API_BASE_URL,
  REKOGNITION_SIMILARITY_THRESHOLD
} = process.env

/**
 * Handle Government ID document uploads, Cloudinary storage, and Digio eKYC verification.
 * @param {string} userId - User identifier
 * @param {Object} file - Multer file object
 * @param {'aadhaar' | 'pan' | 'passport'} docType - Government ID type
 */
export const uploadIDDocument = async (userId, file, docType) => {
  try {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // 1. Upload ID document to Cloudinary secure private directory
    const uploadResult = await uploadToCloudinary(file.buffer, {
      folder: process.env.CLOUDINARY_PRIVATE_FOLDER || 'troopp-ids',
      resource_type: 'auto',
      access_mode: 'authenticated'
    })

    const documentUrl = uploadResult.secure_url
    user.id_document_url = documentUrl
    await user.save()

    // 2. Perform Digio Gateway eKYC Verification
    let kycData = null
    const isDigioConfigured = DIGIO_CLIENT_ID && DIGIO_CLIENT_SECRET && DIGIO_API_BASE_URL

    if (isDigioConfigured) {
      try {
        const form = new FormData()
        form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype })
        form.append('doc_type', docType)

        const authHeader = 'Basic ' + Buffer.from(`${DIGIO_CLIENT_ID}:${DIGIO_CLIENT_SECRET}`).toString('base64')
        const response = await axios.post(`${DIGIO_API_BASE_URL}/v2/kyc`, form, {
          headers: {
            ...form.getHeaders(),
            'Authorization': authHeader
          }
        })
        kycData = response.data
        logger.info(`Digio eKYC response successful for user: ${userId}`)
      } catch (digioError) {
        logger.error(`Digio verification API failed for user ${userId}:`, digioError)
        // Fallback to manual review on API failures
        user.verification_status = 'manual_review'
        await user.save()
        
        await sendNotification(userId, {
          type: 'id_verification_manual_review',
          title: 'ID Verification in Review',
          body: 'We are manually reviewing your document verification. This will take up to 24 hours.'
        })

        return { status: 'manual_review', message: 'Digio gateway error. Forwarded to manual review.' }
      }
    } else {
      // Mock successful Digio verification in development/sandbox
      logger.warn(`[DIGIO MOCK]: Sandbox verification active for user: ${userId}`)
      kycData = {
        status: 'success',
        extracted_details: {
          name: 'Raj Malhotra',
          dob: '1998-05-15',
          id_number: 'XXXX-XXXX-1234'
        }
      }
    }

    // 3. Process verification results
    if (kycData && kycData.status === 'success') {
      const { name, dob, id_number } = kycData.extracted_details

      // Encrypt ID payload fields using AES-256 for privacy compliance
      const metadata = JSON.stringify({ name, dob, id_number })
      user.id_metadata = encrypt(metadata)
      user.is_id_verified = true
      user.verification_status = 'verified'
      await user.save()

      // Add +30 trust points for verified government ID
      await addTrustScore(userId, 30, 'id_verified')

      await sendNotification(userId, {
        type: 'id_verification_approved',
        title: 'Identity Verified Successfully',
        body: 'Awesome! Your government ID is verified. You earned +30 Trust Points!'
      })

      return { status: 'verified', message: 'Identity successfully verified.' }
    } else {
      user.verification_status = 'failed'
      await user.save()
      return { status: 'failed', message: 'Verification rejected by gatekeeper.' }
    }
  } catch (error) {
    logger.error(`KYC Document upload process failed for user ${userId}:`, error)
    throw error
  }
}

/**
 * Compare selfie upload with secure Cloudinary ID photo using AWS Rekognition.
 * @param {string} userId - User identifier
 * @param {Object} selfieFile - Multer selfie photo file
 */
export const compareFaces = async (userId, selfieFile) => {
  try {
    const user = await User.findByPk(userId)
    if (!user) {
      throw new Error('User not found')
    }

    if (!user.id_document_url) {
      throw new Error('No verified ID document exists. Please upload an ID first.')
    }

    // 1. Retrieve the target ID document from storage
    let idDocumentBuffer
    try {
      const docResponse = await axios.get(user.id_document_url, { responseType: 'arraybuffer' })
      idDocumentBuffer = Buffer.from(docResponse.data)
    } catch (fetchError) {
      logger.error(`Failed to fetch document buffer from ${user.id_document_url}:`, fetchError)
      throw new Error('Could not retrieve ID document for face comparison.')
    }

    // 2. Perform Face Comparison
    const threshold = parseInt(REKOGNITION_SIMILARITY_THRESHOLD || '85', 10)
    let isMatch = false
    let matchSimilarity = 0

    if (rekognitionClient) {
      try {
        const command = new CompareFacesCommand({
          SourceImage: { Bytes: selfieFile.buffer },
          TargetImage: { Bytes: idDocumentBuffer },
          SimilarityThreshold: threshold
        })

        const rekResponse = await rekognitionClient.send(command)
        const faceMatches = rekResponse.FaceMatches || []

        if (faceMatches.length > 0) {
          matchSimilarity = faceMatches[0].Similarity || 0
          isMatch = matchSimilarity >= threshold
          logger.info(`AWS Rekognition match similarity: ${matchSimilarity}% (Match: ${isMatch})`)
        } else {
          logger.warn(`AWS Rekognition completed: Face detected but no matches found for user ${userId}`)
        }
      } catch (awsError) {
        logger.error(`AWS Rekognition CompareFaces call failed for user ${userId}:`, awsError)
        // Check if faces were detected in the images
        if (awsError.name === 'InvalidParameterException' || awsError.message?.includes('does not contain a face')) {
          throw new AppError('Face not detected in one or both of the uploaded images.', 400, 'FACE_NOT_DETECTED')
        }
        
        // Fail gracefully to manual review for other AWS issues
        user.verification_status = 'manual_review'
        await user.save()
        return { status: 'manual_review', message: 'AWS gateway error. Sent to manual review.' }
      }
    } else {
      // Mock successful face comparison in development
      logger.warn(`[REKOGNITION MOCK]: Mock face check active for user: ${userId}`)
      isMatch = true
      matchSimilarity = 94.5
    }

    // 3. Process matches
    if (isMatch) {
      user.is_face_verified = true
      user.selfie_url = 'https://res.cloudinary.com/mock-cloud/selfie.jpg' // Save mockup or handle selfie save
      await user.save()

      // Add +15 trust points for face match verification
      await addTrustScore(userId, 15, 'face_verified')

      await sendNotification(userId, {
        type: 'face_verification_approved',
        title: 'Selfie Verified successfully',
        body: 'Face match check verified! You earned +15 Trust Points.'
      })

      return { status: 'verified', similarity: matchSimilarity }
    } else {
      user.verification_status = 'manual_review'
      await user.save()
      return { status: 'manual_review', message: 'Similarity below threshold. Transferred to manual review.' }
    }
  } catch (error) {
    logger.error(`Face comparison failed for user ${userId}:`, error)
    throw error
  }
}
