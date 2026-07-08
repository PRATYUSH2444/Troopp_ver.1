import { jest } from '@jest/globals'
import { addReliability, deductReliability } from '../../src/modules/trust/reliability.service.js'
import User from '../../src/models/User.js'
import ReliabilityScoreLog from '../../src/models/ReliabilityScoreLog.js'
import * as notificationService from '../../src/services/notification.service.js'

// Mock dependencies
jest.mock('../../src/models/User.js')
jest.mock('../../src/models/ReliabilityScoreLog.js')
jest.mock('../../src/services/notification.service.js')

describe('Reliability Score Service Unit Tests', () => {
  let mockUser

  beforeEach(() => {
    jest.clearAllMocks()
    mockUser = {
      id: 'user-1',
      email: 'test@troopp.com',
      reliability_score: 80,
      score_frozen: false,
      save: jest.fn().mockResolvedValue(true)
    }
    User.findByPk = jest.fn().mockResolvedValue(mockUser)
    ReliabilityScoreLog.create = jest.fn().mockResolvedValue(true)
    notificationService.sendNotification = jest.fn().mockResolvedValue(true)
  })

  test('addReliability increases score up to 100 limit', async () => {
    const score = await addReliability('user-1', 10, 'trip_attended')
    expect(score).toBe(90)
    expect(mockUser.reliability_score).toBe(90)
    expect(mockUser.save).toHaveBeenCalled()
    expect(ReliabilityScoreLog.create).toHaveBeenCalled()
    expect(notificationService.sendNotification).toHaveBeenCalled()
  })

  test('addReliability caps score at 100 limit', async () => {
    const score = await addReliability('user-1', 30, 'trip_attended')
    expect(score).toBe(100)
  })

  test('addReliability does not modify score if user score is frozen', async () => {
    mockUser.score_frozen = true
    const score = await addReliability('user-1', 10, 'trip_attended')
    expect(score).toBe(80)
    expect(mockUser.save).not.toHaveBeenCalled()
  })

  test('deductReliability decreases score down to 0 floor', async () => {
    const score = await deductReliability('user-1', 20, 'no_show')
    expect(score).toBe(60)
    expect(mockUser.reliability_score).toBe(60)
  })

  test('deductReliability caps score at 0 floor', async () => {
    const score = await deductReliability('user-1', 90, 'no_show')
    expect(score).toBe(0)
    expect(mockUser.reliability_score).toBe(0)
  })
})
