import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from '../../utils/haptics.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

/**
 * Reusable Floating Action Button (FAB) that expands a category shortcut menu
 * on long press, and navigates on short tap.
 */
export const RadialFAB = () => {
  const [showRadial, setShowRadial] = useState(false)
  const navigate = useNavigate()
  const pressTimerRef = useRef(null)
  const isLongPressRef = useRef(false)
  const reduced = useReducedMotion()

  // Handle outside Tap/Escape key closures
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowRadial(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleStartPress = (e) => {
    isLongPressRef.current = false
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      haptics.success() // Long press vibration indicator chimes
      setShowRadial(true)
    }, 500) // 500ms long press hold threshold
  }

  const handleEndPress = (targetUrl) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
    }
    if (!isLongPressRef.current) {
      haptics.lightTap()
      navigate(targetUrl)
    }
  }

  const handleCancelPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
    }
  }

  return (
    <div className="md:hidden fixed bottom-24 right-6 z-50">
      {/* Backdrop */}
      <AnimatePresence>
        {showRadial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            onClick={() => setShowRadial(false)}
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-40 cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Radial Options */}
      <AnimatePresence>
        {showRadial && (
          <>
            {/* Trek */}
            <motion.button
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{ scale: 1, x: -85, y: -15 }}
              exit={{ scale: 0, x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: reduced ? 0 : 0.05, duration: reduced ? 0 : undefined }}
              onClick={() => {
                haptics.lightTap()
                setShowRadial(false)
                navigate('/activities/create?category=Trekking&step=2')
              }}
              className="absolute w-12 h-12 rounded-full bg-surface border border-border shadow-lg flex flex-col items-center justify-center text-xs font-black text-text-primary z-50 hover:bg-stone-50 dark:hover:bg-stone-800 active:scale-95 cursor-pointer select-none focus:outline-none"
            >
              <span className="text-lg">🥾</span>
              <span className="text-[7px] uppercase tracking-tighter leading-none mt-0.5">Trek</span>
            </motion.button>

            {/* Road Trip */}
            <motion.button
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{ scale: 1, x: -70, y: -55 }}
              exit={{ scale: 0, x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: reduced ? 0 : 0.1, duration: reduced ? 0 : undefined }}
              onClick={() => {
                haptics.lightTap()
                setShowRadial(false)
                navigate('/activities/create?category=Road%20Trips&step=2')
              }}
              className="absolute w-12 h-12 rounded-full bg-surface border border-border shadow-lg flex flex-col items-center justify-center text-xs font-black text-text-primary z-50 hover:bg-stone-50 dark:hover:bg-stone-800 active:scale-95 cursor-pointer select-none focus:outline-none"
            >
              <span className="text-lg">🚗</span>
              <span className="text-[7px] uppercase tracking-tighter leading-none mt-0.5">Road</span>
            </motion.button>

            {/* Night Drive */}
            <motion.button
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{ scale: 1, x: -45, y: -80 }}
              exit={{ scale: 0, x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: reduced ? 0 : 0.15, duration: reduced ? 0 : undefined }}
              onClick={() => {
                haptics.lightTap()
                setShowRadial(false)
                navigate('/activities/create?category=Night%20Drives&step=2')
              }}
              className="absolute w-12 h-12 rounded-full bg-surface border border-border shadow-lg flex flex-col items-center justify-center text-xs font-black text-text-primary z-50 hover:bg-stone-50 dark:hover:bg-stone-800 active:scale-95 cursor-pointer select-none focus:outline-none"
            >
              <span className="text-lg">🌙</span>
              <span className="text-[7px] uppercase tracking-tighter leading-none mt-0.5">Night</span>
            </motion.button>

            {/* Day Trip */}
            <motion.button
              initial={{ scale: 0, x: 0, y: 0 }}
              animate={{ scale: 1, x: -5, y: -90 }}
              exit={{ scale: 0, x: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: reduced ? 0 : 0.2, duration: reduced ? 0 : undefined }}
              onClick={() => {
                haptics.lightTap()
                setShowRadial(false)
                navigate('/activities/create?category=Day%20Trips&step=2')
              }}
              className="absolute w-12 h-12 rounded-full bg-surface border border-border shadow-lg flex flex-col items-center justify-center text-xs font-black text-text-primary z-50 hover:bg-stone-50 dark:hover:bg-stone-800 active:scale-95 cursor-pointer select-none focus:outline-none"
            >
              <span className="text-lg">☀️</span>
              <span className="text-[7px] uppercase tracking-tighter leading-none mt-0.5">Day</span>
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onMouseDown={handleStartPress}
        onMouseUp={() => handleEndPress('/activities/create')}
        onMouseLeave={handleCancelPress}
        onTouchStart={handleStartPress}
        onTouchEnd={() => handleEndPress('/activities/create')}
        onTouchMove={handleCancelPress}
        animate={{ rotate: showRadial ? 45 : 0 }}
        transition={{ duration: reduced ? 0 : 0.25 }}
        className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl hover:bg-primary-dark cursor-pointer select-none z-50 relative focus:outline-none active:scale-95 transition-transform"
      >
        <span className="text-2xl font-bold">+</span>
      </motion.button>
    </div>
  )
}

export default RadialFAB
