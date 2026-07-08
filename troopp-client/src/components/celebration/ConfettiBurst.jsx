import React, { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

/**
 * Reusable Canvas-Confetti wrapper component that triggers bursts on activation
 * while automatically respecting system prefers-reduced-motion choices.
 */
export const ConfettiBurst = ({ 
  active, 
  colors, 
  particleCount = 70, 
  spread = 60, 
  origin = { y: 0.65 } 
}) => {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (active && !reduced) {
      confetti({
        particleCount,
        spread,
        origin,
        colors
      })
    }
  }, [active, reduced, colors, particleCount, spread, origin])

  return null
}

export default ConfettiBurst
