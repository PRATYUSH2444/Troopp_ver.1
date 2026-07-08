import { jest } from '@jest/globals'
import { addTrustScore, deductTrustScore, getTrustBadge } from '../../src/modules/trust/trust.service.js'
import User from '../../src/models/User.js'
import TrustScoreLog from '../../src/models/TrustScoreLog.js'
import * as notificationService from '../../src/services/notification.service.js'

// Mock dependencies
jest.mock('../../src/models/User.js')
jest.mock('../../src/models/TrustScoreLog.js')
jest.mock('../../src/services/notification.service.js')

describe('Trust Score Service Unit Tests', () => {
  let mockUser

  beforeEach(() => {
    jest.clearAllMocks()
    mockUser = {
      id: 'user-1',
      email: 'test@troopp.com',
      trust_score: 50,
      score_frozen: false,
      save: jest.fn().mockResolvedValue(true)
    }
    User.findByPk = jest.fn().mockResolvedValue(mockUser)
    TrustScoreLog.create = jest.fn().mockResolvedValue(true)
    notificationService.sendNotification = jest.fn().mockResolvedValue(true)
  })

  test('addTrustScore increases trust score up to 100 limit', async () => {
    const score = await addTrustScore('user-1', 30, 'id_verified')
    expect(score).toBe(80)
    expect(mockUser.trust_score).toBe(80)
    expect(mockUser.save).toHaveBeenCalled()
    expect(TrustScoreLog.create).toHaveBeenCalled()
    expect(notificationService.sendNotification).toHaveBeenCalled()
  })

  test('addTrustScore caps trust score at 100', async () => {
    const score = await addTrustScore('user-1', 60, 'id_verified')
    expect(score).toBe(100)
    expect(mockUser.trust_score).toBe(100)
  })

  test('addTrustScore does not modify score if user score is frozen', async () => {
    mockUser.score_frozen = true
    const score = await addTrustScore('user-1', 30, 'id_verified')
    expect(score).toBe(50)
    expect(mockUser.save).not.toHaveBeenCalled()
  })

  test('deductTrustScore decreases trust score down to 0 floor', async () => {
    const score = await deductTrustScore('user-1', 20, 'report_filed')
    expect(score).toBe(30)
    expect(mockUser.trust_score).toBe(30)
  })

  test('deductTrustScore caps trust score at 0 floor', async () => {
    const score = await deductTrustScore('user-1', 60, 'report_filed')
    expect(score).toBe(0)
    expect(mockUser.trust_score).toBe(0)
  })

  test('deductTrustScore does not modify score if user score is frozen', async () => {
    mockUser.score_frozen = true
    const score = await deductTrustScore('user-1', 20, 'report_filed')
    expect(score).toBe(50)
    expect(mockUser.save).not.toHaveBeenCalled()
  })

  test('getTrustBadge maps scores to correct labels and icons', () => {
    expect(getTrustBadge(80)).toEqual({ label: 'Trusted', color: '#166534', icon: 'shield' })
    expect(getTrustBadge(60)).toEqual({ label: 'Verified', color: '#1D4ED8', icon: 'check' })
    expect(getTrustBadge(40)).toEqual({ label: 'New', color: '#78716C', icon: 'info' })
    expect(getTrustBadge(80, true)).toEqual({ label: 'Flagged', color: '#DC2626', icon: 'warning' })
  })
})
