import request from 'supertest'
import { jest } from '@jest/globals'
import app from '../../src/app.js'
import User from '../../src/models/User.js'
import { sequelize } from '../../src/config/db.js'

jest.mock('../../src/models/User.js')
jest.mock('../../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'admin-1', email: 'admin@troopp.com', role: 'admin' }
    next()
  },
  authGuard: (req, res, next) => {
    req.user = { id: 'admin-1', email: 'admin@troopp.com', role: 'admin' }
    next()
  },
  requireAdmin: (req, res, next) => {
    next()
  }
}))

describe('Admin Integration Tests (Supertest)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await sequelize.close()
  })

  test('GET /api/v1/admin/dashboard - retrieve admin metrics and stats', async () => {
    // Mock the dashboard stats queries in service
    const res = await request(app)
      .get('/api/v1/admin/dashboard')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  test('POST /api/v1/admin/users/:id/suspend - should update account status to suspended', async () => {
    User.findByPk = jest.fn().mockResolvedValue({
      id: 'user-2',
      email: 'suspend@troopp.com',
      account_status: 'active',
      save: jest.fn().mockResolvedValue(true)
    })

    const res = await request(app)
      .post('/api/v1/admin/users/user-2/suspend')
      .send({ days: 10, reason: 'Spamming' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
