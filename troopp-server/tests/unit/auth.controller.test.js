import { jest } from '@jest/globals'
import * as authController from '../../src/controllers/auth.controller.js'
import User from '../../src/models/User.js'
import Profile from '../../src/models/Profile.js'
import TokenBlacklist from '../../src/models/TokenBlacklist.js'
import NotificationPreference from '../../src/models/NotificationPreference.js'
import bcrypt from 'bcrypt'

// Mock dependencies
jest.mock('../../src/models/User.js')
jest.mock('../../src/models/Profile.js')
jest.mock('../../src/models/TokenBlacklist.js')
jest.mock('../../src/models/NotificationPreference.js')
jest.mock('../../src/services/otp.service.js', () => ({
  generateEmailOTP: () => '123456',
  verifyEmailOTP: (email, code) => code === '123456',
  sendPhoneOTP: () => Promise.resolve(true),
  verifyPhoneOTP: (phone, code) => Promise.resolve(code === '123456')
}))
jest.mock('../../src/services/email.service.js', () => ({
  sendOTPEmail: () => Promise.resolve(true),
  sendResetPasswordEmail: () => Promise.resolve(true)
}))

describe('Auth Controller Unit Tests', () => {
  let mockReq, mockRes, mockNext

  beforeEach(() => {
    jest.clearAllMocks()
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn()
    }
    mockNext = jest.fn()
  })

  test('signup sends email verification code', async () => {
    mockReq = { body: { email: 'new@troopp.com' } }
    User.findOne = jest.fn().mockResolvedValue(null)

    await authController.signup(mockReq, mockRes, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: expect.any(String)
    }))
  })

  test('login accepts valid credentials', async () => {
    const password = 'Password@123'
    const passwordHash = await bcrypt.hash(password, 10)
    const mockUser = {
      id: 'user-1',
      email: 'test@troopp.com',
      password_hash: passwordHash,
      account_status: 'active',
      role: 'member',
      trust_score: 50,
      is_id_verified: false
    }

    mockReq = { body: { email: 'test@troopp.com', password } }
    User.findOne = jest.fn().mockResolvedValue(mockUser)
    Profile.findOne = jest.fn().mockResolvedValue({ name: 'Test User' })

    await authController.login(mockReq, mockRes, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      accessToken: expect.any(String)
    }))
  })

  test('login rejects invalid passwords', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@troopp.com',
      password_hash: 'hashed',
      account_status: 'active'
    }

    mockReq = { body: { email: 'test@troopp.com', password: 'wrong' } }
    User.findOne = jest.fn().mockResolvedValue(mockUser)

    await authController.login(mockReq, mockRes, mockNext)

    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401
    }))
  })

  test('logout invalidates access token and clears cookies', async () => {
    mockReq = {
      token: 'valid.jwt.token',
      user: { id: 'user-1', email: 'test@troopp.com' }
    }
    TokenBlacklist.create = jest.fn().mockResolvedValue(true)

    await authController.logout(mockReq, mockRes, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object))
  })
})
