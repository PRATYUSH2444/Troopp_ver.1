import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * Renders user position in waitlist queue.
 */
const WaitlistScreen = ({ position = 1, totalWaitlisted = 5, onWithdraw }) => {
  return (
    <div className="w-full max-w-sm mx-auto text-center py-10 flex flex-col items-center justify-center gap-5">
      {/* Circle indicator */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, transition: { type: 'spring', damping: 12 } }}
        className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-4xl shadow-inner"
      >
        ⏳
      </motion.div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-extrabold text-text-primary">
          You're on the Waitlist!
        </h3>
        <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
          The trip slots are currently full. You have been placed in the waiting queue.
        </p>
      </div>

      {/* Position Badge */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl w-full flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
          Queue Standing
        </span>
        <span className="text-lg font-extrabold">
          Position {position} of {totalWaitlisted}
        </span>
      </div>

      <p className="text-[10px] text-text-secondary">
        🔔 We'll notify you instantly if a confirmed spot opens.
      </p>

      {/* Action buttons */}
      <div className="w-full flex flex-col gap-2.5 mt-2">
        <Link
          to="/feed"
          className="w-full h-11 bg-stone-850 hover:bg-stone-900 text-white font-bold rounded-xl flex items-center justify-center text-xs shadow-md transition-colors"
        >
          Return to Feed
        </Link>
        <button
          onClick={onWithdraw}
          className="w-full h-10 border border-rose-200 text-rose-600 bg-rose-50/10 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
        >
          Withdraw from Waitlist (No Penalty)
        </button>
      </div>
    </div>
  )
}

export default WaitlistScreen
export { WaitlistScreen }
