/**
 * Deterministically compute the Trip Vibe Score label and emoji based on the activity metrics.
 * Evaluates rules in a strict priority order (pure logic, no AI).
 * 
 * @param {string} type - Activity type (trek, camping, etc.)
 * @param {number} costPerPerson - Cost of the activity per head
 * @param {number} maxGroupSize - Max group capacity
 * @param {string} difficultyLevel - Difficulty level (easy, moderate, hard, expert)
 * @returns {string} Mapped vibe score tag (emoji + label)
 */
export const computeVibeScore = (type, costPerPerson, maxGroupSize, difficultyLevel) => {
  const normalizedType = type ? type.toLowerCase().trim() : ''
  const normalizedDifficulty = difficultyLevel ? difficultyLevel.toLowerCase().trim() : ''
  const cost = parseFloat(costPerPerson) || 0
  const group = parseInt(maxGroupSize, 10) || 0

  // 1. Trek + Hard/Expert + group >= 6 -> Hardcore Adventurer
  if (
    normalizedType === 'trek' &&
    (normalizedDifficulty === 'hard' || normalizedDifficulty === 'expert') &&
    group >= 6
  ) {
    return '🏔️ Hardcore Adventurer'
  }

  // 2. Night Drive + cost < 500 -> Spontaneous Night Owl
  if (normalizedType === 'night_drive' && cost < 500) {
    return '🌙 Spontaneous Night Owl'
  }

  // 3. cost == 0 -> Free Spirit
  if (cost === 0) {
    return '💚 Free Spirit'
  }

  // 4. cost < 300 -> Budget Explorer
  if (cost < 300) {
    return '💰 Budget Explorer'
  }

  // 5. cost > 2000 -> Luxury Wanderer
  if (cost > 2000) {
    return '✨ Luxury Wanderer'
  }

  // 6. group_size <= 4 -> Solo-Friendly
  if (group <= 4) {
    return '🤝 Solo-Friendly'
  }

  // 7. group_size >= 8 -> Squad Goals
  if (group >= 8) {
    return '🎉 Squad Goals'
  }

  // 8. Heritage Walk OR Photography Walk -> Culture Seeker
  if (normalizedType === 'heritage_walk' || normalizedType === 'photography_walk') {
    return '📸 Culture Seeker'
  }

  // 9. Camping -> Wilderness Lover
  if (normalizedType === 'camping') {
    return '⛺ Wilderness Lover'
  }

  // 10. Cycling -> Fit & Free
  if (normalizedType === 'cycling') {
    return '🚴 Fit & Free'
  }

  // 11. Road Trip -> Open Road Soul
  if (normalizedType === 'road_trip') {
    return '🚗 Open Road Soul'
  }

  // 12. Default fallback
  return '🌍 Weekend Wanderer'
}

export default computeVibeScore
