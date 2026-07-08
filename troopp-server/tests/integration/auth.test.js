import request from 'supertest'
import { jest } from '@jest/globals'
import app from '../../src/app.js'
import User from '../../src/models/User.js'
import Profile from '../../src/models/Profile.js'
import bcrypt from 'bcrypt'
import { sequelize } from '../../src/config/db.js'

// Mock Sequelize models
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

describe('Auth Integration Tests (Supertest)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await sequelize.close()
  })

  test('POST /api/v1/auth/signup - should trigger email verification code dispatch', async () => {
    User.findOne = jest.fn().mockResolvedValue(null)

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'integrate@troopp.com' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.message).toContain('verification code sent')
  })

  test('POST /api/v1/auth/verify-email - should confirm valid OTP digits', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email: 'integrate@troopp.com', code: '123456' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  test('POST /api/v1/auth/login - reject with 401 on non-existent account', async () => {
    User.findOne = jest.fn().mockResolvedValue(null)

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'missing@troopp.com', password: 'Password@123' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})
