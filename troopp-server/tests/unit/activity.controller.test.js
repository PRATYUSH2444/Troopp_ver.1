import { jest } from '@jest/globals'
import * as activityController from '../../src/modules/activities/activities.controller.js'
import Activity from '../../src/models/Activity.js'
import ActivityMember from '../../src/models/ActivityMember.js'

// Mock dependencies
jest.mock('../../src/models/Activity.js')
jest.mock('../../src/models/ActivityMember.js')
jest.mock('../../src/modules/activities/activities.repository.js', () => ({
  findActivitiesFiltered: () => Promise.resolve([]),
  searchActivitiesFullText: () => Promise.resolve([]),
  findFollowedActivitiesFiltered: () => Promise.resolve([])
}))

describe('Activity Controller Unit Tests', () => {
  let mockReq, mockRes, mockNext

  beforeEach(() => {
    jest.clearAllMocks()
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    mockNext = jest.fn()
  })

  test('getAllActivities returns list of filtered activities', async () => {
    mockReq = {
      query: { cityId: 'city-1' },
      user: { id: 'user-1' }
    }

    await activityController.getAllActivities(mockReq, mockRes, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.any(Array)
    }))
  })

  test('createActivity builds and returns a new activity', async () => {
    const mockActivity = {
      id: 'activity-1',
      creator_id: 'user-1',
      title: 'Camping in Wilderness',
      type: 'camping',
      current_members: 1,
      save: jest.fn().mockResolvedValue(true)
    }
    mockReq = {
      body: {
        title: 'Camping in Wilderness',
        type: 'camping',
        description: 'Enjoy nature',
        date_time: new Date(),
        meeting_point_lat: 12.97,
        meeting_point_lng: 77.59,
        meeting_point_label: 'Main Gate',
        destination: 'Forest Park',
        city_id: 'city-1',
        max_group_size: 5,
        cost_per_person: 100
      },
      user: { id: 'user-1' }
    }

    Activity.create = jest.fn().mockResolvedValue(mockActivity)
    ActivityMember.create = jest.fn().mockResolvedValue(true)

    await activityController.createActivity(mockReq, mockRes, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(201)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.any(Object)
    }))
  })

  test('getActivityById returns detailed activity object', async () => {
    const mockActivity = {
      id: 'activity-1',
      title: 'Trekking Peak',
      getCreator: () => Promise.resolve({ id: 'user-1' })
    }
    mockReq = {
      params: { id: 'activity-1' },
      user: { id: 'user-1' }
    }
    Activity.findByPk = jest.fn().mockResolvedValue(mockActivity)
    ActivityMember.findAll = jest.fn().mockResolvedValue([])

    await activityController.getActivityById(mockReq, mockRes, mockNext)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.any(Object)
    }))
  })
})
