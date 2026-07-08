import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

/**
 * Modular rising points particle effect used to reward score changes.
 * Automatically bypassed if the user prefers reduced motion to prevent visual clutter.
 */
export const FloatingParticle = ({ particles = [], onComplete }) => {
  const reduced = useReducedMotion()

  if (reduced || !particles.length) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ y: p.y, x: p.x, opacity: 1, scale: 0.8 }}
            animate={{ y: p.y - 80, opacity: 0, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            onAnimationComplete={() => {
              if (onComplete) onComplete(p.id)
            }}
            className={`absolute font-black text-sm tracking-wide select-none filter drop-shadow-sm ${p.colorClass || 'text-emerald-500'}`}
          >
            {p.value}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default FloatingParticle
