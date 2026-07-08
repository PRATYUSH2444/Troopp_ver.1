import React, { useState, useEffect, useRef } from 'react'
import { motion, animate } from 'framer-motion'
import clsx from 'clsx'

/**
 * @typedef {Object} ScoreBarProps
 * @property {number} score - Metric score value (0-100)
 * @property {string} [label] - Optional header label to display above
 * @property {boolean} [showTextVal] - Display the raw numeric score on the right side
 * @property {string} [className] - Class overrides
 */

/**
 * Troopp Common Animated Score Progress Bar with warning flashes and liquid drains.
 * @param {ScoreBarProps} props
 */
const ScoreBar = ({ score = 50, label, showTextVal = true, className }) => {
  const clampedScore = Math.max(0, Math.min(100, score))
  const prevScoreRef = useRef(clampedScore)
  const [displayScore, setDisplayScore] = useState(clampedScore)
  const [flashRed, setFlashRed] = useState(false)

  // Dynamically assign bar colors based on rating levels
  const getBarColor = (val) => {
    if (val >= 70) return 'bg-secondary' // Green
    if (val >= 40) return 'bg-status-warning' // Amber
    return 'bg-status-danger' // Red
  }

  const getBarColorHex = (val) => {
    if (val >= 70) return '#10b981' // Green
    if (val >= 40) return '#f59e0b' // Amber
    return '#ef4444' // Red
  }

  useEffect(() => {
    const oldVal = prevScoreRef.current
    const newVal = clampedScore

    if (newVal !== oldVal) {
      const isDecrease = newVal < oldVal

      if (isDecrease) {
        // Flash red twice first, then drain (400ms duration)
        setFlashRed(true)
        setTimeout(() => {
          setFlashRed(false)
          // Ticker countdown (800ms)
          animate(oldVal, newVal, {
            duration: 0.8,
            ease: 'easeInOut',
            onUpdate: (latest) => setDisplayScore(Math.round(latest))
          })
        }, 400)
      } else {
        // Ticker countup (800ms)
        animate(oldVal, newVal, {
          duration: 0.8,
          ease: 'easeOut',
          onUpdate: (latest) => setDisplayScore(Math.round(latest))
        })
      }
      prevScoreRef.current = newVal
    } else {
      setDisplayScore(clampedScore)
    }
  }, [clampedScore])

  const settledColorHex = getBarColorHex(clampedScore)

  return (
    <div className={clsx('flex flex-col gap-1 w-full text-left font-sans', className)}>
      {/* Title & Numeric value */}
      {(label || showTextVal) && (
        <div className="flex items-center justify-between text-xs font-semibold text-text-primary">
          {label && <span>{label}</span>}
          {showTextVal && (
            <span
              className={clsx(
                clampedScore >= 70 && 'text-secondary',
                clampedScore >= 40 && clampedScore < 70 && 'text-status-warning',
                clampedScore < 40 && 'text-status-danger'
              )}
            >
              {displayScore}/100
            </span>
          )}
        </div>
      )}

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-border/50 rounded-full overflow-hidden shadow-inner relative">
        {/* Animated Fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={
            flashRed
              ? {
                  width: `${prevScoreRef.current}%`,
                  backgroundColor: ['#ef4444', '#ffffff', '#ef4444', '#ffffff', settledColorHex]
                }
              : {
                  width: `${clampedScore}%`,
                  backgroundColor: settledColorHex
                }
          }
          transition={
            flashRed
              ? { duration: 0.4, times: [0, 0.25, 0.5, 0.75, 1.0] }
              : { duration: 0.8, ease: 'easeOut' }
          }
          className="h-full rounded-full"
        />
      </div>
    </div>
  )
}

export default ScoreBar
export { ScoreBar }

