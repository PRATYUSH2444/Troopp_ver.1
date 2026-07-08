import { useReducedMotion as fmUseReducedMotion } from 'framer-motion'
import { useState, useEffect } from 'react'

/**
 * Custom hook to detect if the user's OS or browser prefers reduced motion.
 * Returns true if reduced motion is enabled.
 */
export const useReducedMotion = () => {
  const fmReduced = fmUseReducedMotion()
  const [reduced, setReduced] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
    return false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(media.matches)

    const listener = (e) => setReduced(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  return fmReduced || reduced
}

export default useReducedMotion
