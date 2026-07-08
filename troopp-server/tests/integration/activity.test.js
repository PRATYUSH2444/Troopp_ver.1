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

describe('Activity Integration Tests (Supertest)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await sequelize.close()
  })

  test('GET /api/v1/activities - load feed list of trips', async () => {
    const res = await request(app)
      .get('/api/v1/activities')
      .query({ cityId: 'city-uuid' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  test('POST /api/v1/activities - host creation should succeed with payload validations', async () => {
    const mockActivity = {
      id: 'activity-uuid',
      creator_id: 'user-1',
      title: 'Trek peaks',
      type: 'trek'
    }
    Activity.create = jest.fn().mockResolvedValue(mockActivity)
    ActivityMember.create = jest.fn().mockResolvedValue(true)

    const res = await request(app)
      .post('/api/v1/activities')
      .send({
        title: 'Trek peaks',
        type: 'trek',
        description: 'Trek to target peak',
        date_time: new Date(),
        meeting_point_lat: 12.97,
        meeting_point_lng: 77.59,
        meeting_point_label: 'Start gate',
        destination: 'Hilltop peak',
        city_id: '861a5b81-d144-4b53-8e4a-932d56a2bbcb', // valid city uuid format
        max_group_size: 8,
        cost_per_person: 0
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.title).toBe('Trek peaks')
  })
})
