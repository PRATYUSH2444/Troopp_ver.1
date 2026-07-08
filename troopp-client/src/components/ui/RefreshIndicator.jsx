import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

/**
 * Floating action notification banner that slides down from top-center when new trips are discovered.
 */
export const RefreshIndicator = ({ count = 0, onRefresh }) => {
  const reduced = useReducedMotion()

  if (count <= 0) return null

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        initial={{ y: -50, x: '-50%', opacity: 0 }}
        animate={{ y: 0, x: '-50%', opacity: 1 }}
        exit={{ y: -50, x: '-50%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25, duration: reduced ? 0 : undefined }}
        onClick={onRefresh}
        className="fixed top-20 left-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg border border-primary-dark/30 hover:bg-primary-dark active:scale-95 transition-all z-40 select-none cursor-pointer flex items-center gap-1.5 focus:outline-none"
      >
        <span>🔄</span>
        <span>{count} {count === 1 ? 'New Trip' : 'New Trips'} Available</span>
      </motion.button>
    </AnimatePresence>
  )
}

export default RefreshIndicator
