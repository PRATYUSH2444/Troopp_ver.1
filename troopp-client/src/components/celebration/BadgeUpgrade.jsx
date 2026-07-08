import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import ScoreCountUp from './ScoreCountUp.jsx'

/**
 * Fullscreen celebration pop-up overlay shown when a user's trust level upgraded.
 * Reverts animations to static/instant if prefers-reduced-motion is active.
 */
export const BadgeUpgrade = ({ isOpen, onClose, level = 'verified' }) => {
  const reduced = useReducedMotion()

  if (!isOpen) return null

  const isTrusted = level === 'trusted'
  const title = isTrusted ? "You're now a Trusted member of Troopp!" : "You're now Verified!"
  const subtitle = isTrusted ? "Your trust score reached 75" : "Your trust score reached 50"
  const badgeEmoji = isTrusted ? "👑" : "🛡️"
  const badgeColor = isTrusted ? "text-emerald-500" : "text-blue-500"

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: reduced ? 1 : 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: reduced ? 1 : 0.9, opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.3 }}
          className="w-full max-w-sm bg-surface border border-border rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-5 select-none"
        >
          {/* Rotating Badge symbol */}
          <motion.div
            initial={{ rotate: reduced ? 0 : -180, scale: reduced ? 1 : 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: reduced ? 0 : 0.2, duration: reduced ? 0 : undefined }}
            className={`w-24 h-24 rounded-full bg-stone-50 dark:bg-stone-800/50 border border-border flex items-center justify-center text-5xl shadow-md ${badgeColor}`}
          >
            {badgeEmoji}
          </motion.div>

          <div className="flex flex-col gap-2">
            <h3 className="font-heading font-black text-lg text-text-primary leading-snug">
              {title}
            </h3>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">
              {subtitle} (<ScoreCountUp value={isTrusted ? 75 : 50} duration={1.2} /> pts)
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full h-11 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider shadow cursor-pointer transition-colors focus:outline-none"
          >
            Awesome!
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default BadgeUpgrade
