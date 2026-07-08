import { Router } from 'express'
import { authGuard } from '../middleware/auth.middleware.js'
import { uploadID, uploadSingle } from '../middleware/upload.middleware.js'
import * as kycService from '../modules/trust/kyc.service.js'
import { AppError } from '../middleware/errorHandler.middleware.js'
import logger from '../config/logger.js'

const router = Router()

// All KYC actions are protected
router.use(authGuard)

/**
 * POST /api/v1/kyc/upload-id
 * Accepts government ID document upload (Aadhaar, PAN, Passport).
 */
router.post('/upload-id', uploadID('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No document file was uploaded.', 400, 'FILE_MISSING'))
    }

    const { docType } = req.body
    if (!docType || !['aadhaar', 'pan', 'passport'].includes(docType.toLowerCase())) {
      return next(new AppError('Invalid or missing docType (must be aadhaar, pan, or passport).', 400, 'INVALID_DOCTYPE'))
    }

    const result = await kycService.uploadIDDocument(req.user.id, req.file, docType.toLowerCase())
    
    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /api/v1/kyc/compare-face
 * Uploads selfie photo and runs comparison check against the ID card.
 */
router.post('/compare-face', uploadSingle('selfie'), async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No selfie photo was uploaded.', 400, 'FILE_MISSING'))
    }

    const result = await kycService.compareFaces(req.user.id, req.file)

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    next(error)
  }
})

export default router
