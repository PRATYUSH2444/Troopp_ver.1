import React, { useEffect, useState } from 'react'
import { animate } from 'framer-motion'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

/**
 * Reusable animated counting number ticker for trust and reliability scores.
 * Reverts to instant updates if prefers-reduced-motion is enabled.
 */
export const ScoreCountUp = ({ value = 0, duration = 1.0 }) => {
  const [displayVal, setDisplayVal] = useState(value)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) {
      setDisplayVal(value)
      return
    }

    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setDisplayVal(Math.round(latest))
      }
    })

    return () => controls.stop()
  }, [value, duration, reduced])

  return <span>{displayVal}</span>
}

export default ScoreCountUp
