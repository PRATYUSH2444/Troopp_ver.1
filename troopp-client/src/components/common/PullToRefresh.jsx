import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

/**
 * Reusable Pull-To-Refresh harness with rotating logo and spring dynamics.
 */
const PullToRefresh = ({ onRefresh, children, className }) => {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)
  const containerRef = useRef(null)
  const startY = useRef(0)
  const isPulling = useRef(false)

  const THRESHOLD = 85

  const handleTouchStart = (e) => {
    if (refreshing) return
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    if (scrollTop === 0) {
      startY.current = e.touches[0].pageY
      isPulling.current = true
    }
  }

  const handleTouchMove = (e) => {
    if (!isPulling.current || refreshing) return
    const currentY = e.touches[0].pageY
    const diff = currentY - startY.current

    if (diff > 0) {
      // Apply resistance physics
      const distance = Math.min(diff * 0.4, 130)
      setPullDistance(distance)
      setCanRefresh(distance >= THRESHOLD)

      // Prevent default scrolling when pulling down at top
      if (e.cancelable) {
        e.preventDefault()
      }
    } else {
      isPulling.current = false
      setPullDistance(0)
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling.current || refreshing) return
    isPulling.current = false

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true)
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(15) // Trigger haptic click
      }
      try {
        await onRefresh()
      } catch (err) {
        console.error('Refresh failed:', err)
      } finally {
        setRefreshing(false)
        setPullDistance(0)
        setCanRefresh(false)
      }
    } else {
      // Snaps back
      setPullDistance(0)
      setCanRefresh(false)
    }
  }

  // Bind mouse drag support for desktop testing
  const handleMouseDown = (e) => {
    if (refreshing) return
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    if (scrollTop === 0) {
      startY.current = e.pageY
      isPulling.current = true
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
  }

  const handleMouseMove = (e) => {
    if (!isPulling.current) return
    const diff = e.pageY - startY.current
    if (diff > 0) {
      const distance = Math.min(diff * 0.35, 130)
      setPullDistance(distance)
      setCanRefresh(distance >= THRESHOLD)
    }
  }

  const handleMouseUp = () => {
    isPulling.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    handleTouchEnd()
  }

  const rotation = (pullDistance / THRESHOLD) * 360
  const progressScale = Math.min(pullDistance / THRESHOLD, 1)

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      className={clsx('relative w-full h-full touch-pan-x', className)}
    >
      {/* Pull indicator spinner drawer */}
      <motion.div
        style={{ height: refreshing ? 60 : pullDistance }}
        className="overflow-hidden flex flex-col items-center justify-center bg-stone-50/40 relative z-40 w-full"
      >
        <div className="flex flex-col items-center gap-1 py-3 select-none">
          <motion.div
            animate={
              refreshing
                ? { rotate: 360, y: [0, -6, 0] }
                : { rotate: rotation, scale: progressScale }
            }
            transition={
              refreshing
                ? {
                    rotate: { repeat: Infinity, duration: 1, ease: 'linear' },
                    y: { repeat: Infinity, duration: 0.6, ease: 'easeInOut' }
                  }
                : { duration: 0.1 }
            }
            className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white text-xs font-black shadow-md border-2 border-primary/20"
          >
            T
          </motion.div>
          {pullDistance > 20 && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[9px] font-black uppercase tracking-widest text-stone-500"
            >
              {refreshing ? 'REFRESHING...' : canRefresh ? 'RELEASE TO REFRESH' : 'PULL TO REFRESH'}
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* Target Content area */}
      <motion.div
        animate={refreshing ? { y: 0 } : { y: pullDistance * 0.15 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default PullToRefresh
export { PullToRefresh }
