import request from 'supertest'
import { jest } from '@jest/globals'
import app from '../../src/app.js'
import Activity from '../../src/models/Activity.js'
import ActivityMember from '../../src/models/ActivityMember.js'
import { sequelize } from '../../src/config/db.js'

jest.mock('../../src/models/Activity.js')
jest.mock('../../src/models/ActivityMember.js')
jest.mock('../../src/middleware/auth.middleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'user-1', email: 'test@troopp.com', role: 'member' }
    next()
  },
  authGuard: (req, res, next) => {
    req.user = { id: 'user-1', email: 'test@troopp.com', role: 'member' }
    next()
  }
}))

describe('Trip Room Integration Tests (Supertest)', () => {
  const roomId = 'room-uuid-12345'

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock confirmed membership
    ActivityMember.findOne = jest.fn().mockResolvedValue({
      activity_id: roomId,
      user_id: 'user-1',
      status: 'confirmed'
    })
    Activity.findByPk = jest.fn().mockResolvedValue({
      id: roomId,
      creator_id: 'user-1',
      title: 'Trek Adventure'
    })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  test('GET /api/v1/trip-rooms/:id/messages - load paginated chat logs', async () => {
    const res = await request(app)
      .get(`/api/v1/trip-rooms/${roomId}/messages`)
      
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  test('POST /api/v1/trip-rooms/:id/expenses - should log new trip expense split', async () => {
    // Mock confirmed member checks for all
    ActivityMember.findAll = jest.fn().mockResolvedValue([
      { user_id: 'user-1', status: 'confirmed' }
    ])

    const res = await request(app)
      .post(`/api/v1/trip-rooms/${roomId}/expenses`)
      .send({
        amount: 1500,
        description: 'Fuel costs',
        splitType: 'equal'
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
  })
})
