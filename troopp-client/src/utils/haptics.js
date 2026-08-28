/**
 * Unified Haptic Feedback utility for Troopp PWA.
 * Wraps navigator.vibrate() to check device support safely.
 */
export const haptics = {
  vibrate(pattern) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern)
      } catch (e) {
        console.warn('Haptic vibration failed:', e)
      }
    }
  },
  
  // Light tap (button press)
  lightTap() {
    this.vibrate(30)
  },
  
  // Success confirmation
  success() {
    this.vibrate([50, 30, 50])
  },
  
  // Error / shake
  error() {
    this.vibrate([100, 50, 100, 50, 100])
  },
  
  // SOS trigger
  sos() {
    this.vibrate([200, 100, 200, 100, 200])
  },
  
  // Join request approved
  joinApproved() {
    this.vibrate([50, 30, 50, 30, 100])
  },
  
  // Trust score increase
  trustIncrease() {
    this.vibrate([30, 20, 80])
  },
  
  // Trust score decrease
  trustDecrease() {
    this.vibrate([100, 50, 100])
  },
  
  // New message in Trip Room
  newMessage() {
    this.vibrate(20)
  },
  
  // Waypoint check-in confirmed
  waypointCheckin() {
    this.vibrate([50, 30, 50])
  },
  
  // Poll vote registered
  pollVote() {
    this.vibrate(40)
  },
  
  // Expense settled
  expenseSettle() {
    this.vibrate([30, 20, 60])
  },
  
  // Tab switch
  tabSwitch() {
    this.vibrate(15)
  },
  
  // Rating submitted
  ratingSubmit() {
    this.vibrate([50, 30, 50, 30, 100])
  },

  // Aliases for compatibility
  impactLight() {
    this.lightTap()
  },
  impactMedium() {
    this.vibrate(50)
  },
  impactHeavy() {
    this.vibrate(100)
  },
  sosTriggered() {
    this.sos()
  }
}

export default haptics
