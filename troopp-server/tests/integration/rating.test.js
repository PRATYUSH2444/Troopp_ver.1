import request from 'supertest'
import { jest } from '@jest/globals'
import app from '../../src/app.js'
import CoTravelerRating from '../../src/models/CoTravelerRating.js'
import Activity from '../../src/models/Activity.js'
import ActivityMember from '../../src/models/ActivityMember.js'
import { sequelize } from '../../src/config/db.js'

jest.mock('../../src/models/CoTravelerRating.js')
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

describe('Ratings Integration Tests (Supertest)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await sequelize.close()
  })

  test('POST /api/v1/ratings - submit feedback rating', async () => {
    const activityId = 'activity-123'
    
    // Mock user being a confirmed member of a completed activity
    Activity.findByPk = jest.fn().mockResolvedValue({
      id: activityId,
      status: 'completed',
      date_time: new Date()
    })
    ActivityMember.findOne = jest.fn().mockResolvedValue({
      activity_id: activityId,
      user_id: 'user-1',
      status: 'confirmed'
    })
    CoTravelerRating.findOne = jest.fn().mockResolvedValue(null)
    CoTravelerRating.create = jest.fn().mockResolvedValue({
      id: 'rating-1'
    })

    const res = await request(app)
      .post('/api/v1/ratings')
      .send({
        activityId,
        targetUserId: 'user-2',
        respectfulScore: 4,
        coordinationScore: 5,
        comfortScore: 5,
        wouldTravelAgain: true
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
  })
})
