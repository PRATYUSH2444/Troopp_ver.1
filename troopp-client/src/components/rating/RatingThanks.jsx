import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import confetti from 'canvas-confetti'

/**
 * Success acknowledgment after mutual ratings submission.
 * Fires canvas-confetti.
 */
const RatingThanks = () => {
  useEffect(() => {
    // Burst confetti particles on mount
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    })
  }, [])

  return (
    <div className="w-full max-w-sm mx-auto text-center py-10 flex flex-col items-center justify-center gap-5">
      {/* Confetti emoji container */}
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl shadow-inner animate-pulse">
        🎉
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-extrabold text-text-primary">
          Ratings Submitted!
        </h3>
        <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
          Thank you for helping keep the Troopp community safe and accountable. Your behavioral ratings help verify trust scores.
        </p>
      </div>

      <div className="bg-stone-50 border border-border/80 p-3.5 rounded-xl w-full text-[10px] text-text-secondary leading-snug font-medium">
        🔒 Your feedback is completely private. Other members will never see individual scores or reviews.
      </div>

      <Link
        to="/feed"
        className="w-full h-11 bg-primary text-white font-bold rounded-xl flex items-center justify-center text-xs shadow-md hover:bg-primary-dark transition-colors mt-2"
      >
        Back to Home Feed
      </Link>
    </div>
  )
}

export default RatingThanks
export { RatingThanks }
