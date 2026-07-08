import React from 'react'
import { motion } from 'framer-motion'

/**
 * Interactive card selection for user commitment level (Intent).
 * Defines two choices: 'confirm' (committed, counts for slots) vs 'request' (flexible/maybe).
 */
const JoinIntentSelector = ({ selectedIntent = 'request', onChange }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 15 } }
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
        Select Commitment Level
      </span>
      <div className="grid grid-cols-2 gap-3.5">
        {/* Choice A: "I'm In" (Committed Confirmation) */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onClick={() => onChange('confirm')}
          className={`relative p-4 rounded-2xl border-2 cursor-pointer flex flex-col justify-between min-h-[140px] transition-all bg-surface hover:shadow-md ${
            selectedIntent === 'confirm'
              ? 'border-primary shadow-sm'
              : 'border-border hover:border-text-secondary/30'
          }`}
        >
          {/* Top Check Indicator */}
          {selectedIntent === 'confirm' && (
            <span className="absolute top-3 right-3 text-primary text-sm font-bold">
              ✓
            </span>
          )}
          
          <div className="flex flex-col gap-1">
            <span className="text-sm font-extrabold text-text-primary">I'm In 🎒</span>
            <span className="text-[10px] text-text-secondary leading-snug">
              I am fully committed to attending this trip on the scheduled date.
            </span>
          </div>

          <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded self-start mt-2">
            Counts for Slot
          </span>
        </motion.div>

        {/* Choice B: "Maybe" (Request Intent) */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onClick={() => onChange('request')}
          className={`relative p-4 rounded-2xl border-2 cursor-pointer flex flex-col justify-between min-h-[140px] transition-all bg-surface hover:shadow-md ${
            selectedIntent === 'request'
              ? 'border-primary shadow-sm'
              : 'border-border hover:border-text-secondary/30'
          }`}
        >
          {/* Top Check Indicator */}
          {selectedIntent === 'request' && (
            <span className="absolute top-3 right-3 text-primary text-sm font-bold">
              ✓
            </span>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-sm font-extrabold text-text-primary">Maybe 🤔</span>
            <span className="text-[10px] text-text-secondary leading-snug">
              I am interested but need to discuss logistics before committing.
            </span>
          </div>

          <span className="text-[9px] font-bold px-2 py-0.5 bg-stone-100 text-stone-600 rounded self-start mt-2">
            Pending Discussion
          </span>
        </motion.div>
      </div>
    </div>
  )
}

export default JoinIntentSelector
export { JoinIntentSelector }
