import { computeVibeScore } from '../../src/modules/trust/vibeScore.util.js'

describe('Vibe Score Utility Unit Tests', () => {
  test('Scenario 1: Trek + Hard/Expert + group >= 6 -> Hardcore Adventurer', () => {
    expect(computeVibeScore('trek', 1000, 6, 'hard')).toBe('🏔️ Hardcore Adventurer')
    expect(computeVibeScore('trek', 1000, 8, 'expert')).toBe('🏔️ Hardcore Adventurer')
  })

  test('Scenario 2: Night Drive + cost < 500 -> Spontaneous Night Owl', () => {
    expect(computeVibeScore('night_drive', 400, 5, 'easy')).toBe('🌙 Spontaneous Night Owl')
  })

  test('Scenario 3: cost == 0 -> Free Spirit', () => {
    expect(computeVibeScore('trek', 0, 5, 'easy')).toBe('💚 Free Spirit')
  })

  test('Scenario 4: cost < 300 -> Budget Explorer', () => {
    expect(computeVibeScore('cycling', 250, 5, 'easy')).toBe('💰 Budget Explorer')
  })

  test('Scenario 5: cost > 2000 -> Luxury Wanderer', () => {
    expect(computeVibeScore('road_trip', 2500, 5, 'easy')).toBe('✨ Luxury Wanderer')
  })

  test('Scenario 6: group_size <= 4 -> Solo-Friendly', () => {
    expect(computeVibeScore('trek', 500, 3, 'easy')).toBe('🤝 Solo-Friendly')
  })

  test('Scenario 7: group_size >= 8 -> Squad Goals', () => {
    expect(computeVibeScore('road_trip', 500, 10, 'easy')).toBe('🎉 Squad Goals')
  })

  test('Scenario 8: Heritage Walk OR Photography Walk -> Culture Seeker', () => {
    expect(computeVibeScore('heritage_walk', 500, 6, 'easy')).toBe('📸 Culture Seeker')
    expect(computeVibeScore('photography_walk', 500, 6, 'easy')).toBe('📸 Culture Seeker')
  })

  test('Scenario 9: Camping -> Wilderness Lover', () => {
    expect(computeVibeScore('camping', 500, 6, 'easy')).toBe('⛺ Wilderness Lover')
  })

  test('Scenario 10: Cycling -> Fit & Free', () => {
    expect(computeVibeScore('cycling', 500, 6, 'easy')).toBe('🚴 Fit & Free')
  })

  test('Scenario 11: Road Trip -> Open Road Soul', () => {
    expect(computeVibeScore('road_trip', 500, 6, 'easy')).toBe('🚗 Open Road Soul')
  })

  test('Scenario 12: Default fallback -> Weekend Wanderer', () => {
    expect(computeVibeScore('day_trip', 500, 6, 'easy')).toBe('🌍 Weekend Wanderer')
  })
})
