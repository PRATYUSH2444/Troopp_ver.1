import { useState, useEffect } from 'react'

/**
 * Highly optimized, passive scroll tracking hook using requestAnimationFrame
 * to prevent layout thrashing and maintain smooth rendering.
 */
export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    let requestRunning = false

    const handleScroll = () => {
      if (!requestRunning) {
        requestRunning = true
        requestAnimationFrame(() => {
          setScrollPosition(window.scrollY)
          requestRunning = false
        })
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return scrollPosition
}

export default useScrollPosition
