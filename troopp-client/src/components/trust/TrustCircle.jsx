import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import confetti from 'canvas-confetti'
import clsx from 'clsx'
import { haptics } from '../../utils/haptics.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

/**
 * Reusable animated circular SVG Trust Score circle dial with premium gradients & glows.
 */
const TrustCircle = ({ score = 50, size = 100, onClick }) => {
  const clampedScore = Math.max(0, Math.min(100, score))
  const reduced = useReducedMotion()
  
  const prevScoreRef = useRef(0)
  const [tickerVal, setTickerVal] = useState(0)
  const [fillPercent, setFillPercent] = useState(0)
  const [particles, setParticles] = useState([])
  const [activeBadgeScore, setActiveBadgeScore] = useState(clampedScore)
  const [badgeTrigger, setBadgeTrigger] = useState(0)
  const [showTooltip, setShowTooltip] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const particleIdRef = useRef(0)

  // Trigger animation on mount/update
  useEffect(() => {
    const oldScore = prevScoreRef.current
    const newScore = clampedScore

    animate(oldScore, newScore, {
      duration: reduced ? 0 : 1.2,
      ease: [0.34, 1.56, 0.64, 1], // premium spring-like ease
      onUpdate: (latest) => {
        setFillPercent(latest)
        setTickerVal(Math.round(latest))
      }
    })

    if (newScore !== oldScore && oldScore !== 0) {
      const crossedThreshold =
        (oldScore < 50 && newScore >= 50) ||
        (oldScore < 75 && newScore >= 75) ||
        (oldScore >= 50 && newScore < 50) ||
        (oldScore >= 75 && newScore < 75)

      if (crossedThreshold) {
        if (reduced) {
          setActiveBadgeScore(newScore)
          setBadgeTrigger((prev) => prev + 1)
        } else {
          setTimeout(() => {
            setActiveBadgeScore(newScore)
            setBadgeTrigger((prev) => prev + 1)
          }, 300)
        }
      } else {
        setActiveBadgeScore(newScore)
      }

      // Spawning rising spark particles on positive increases
      const diff = newScore - oldScore
      if (diff > 0) {
        if (!reduced) {
          const count = Math.min(Math.max(Math.floor(diff / 4), 1), 6)
          const newParticles = []
          for (let i = 0; i < count; i++) {
            newParticles.push({
              id: ++particleIdRef.current,
              value: `+${Math.round(diff / count) || 1}`,
              x: (Math.random() - 0.5) * 80,
              y: (Math.random() - 0.5) * 30,
              color: newScore >= 75 ? '#4fbe8e' : newScore >= 50 ? '#3b82f6' : '#ff6a2c'
            })
          }
          setParticles((prev) => [...prev, ...newParticles])

          let color = '#3b82f6'
          if (newScore >= 75) color = '#4fbe8e'
          if (newScore < 50) color = '#ff6a2c'

          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.6 },
            colors: [color, '#ffffff', '#ffc94d']
          })
        }
      }
    } else {
      setActiveBadgeScore(newScore)
    }

    prevScoreRef.current = newScore
  }, [clampedScore, reduced])

  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => setShowTooltip(false), 3500)
      return () => clearTimeout(timer)
    }
  }, [showTooltip])

  const getThemeColors = (val) => {
    if (val >= 75) return { primary: '#4fbe8e', soft: 'rgba(79,190,142,0.14)', glow: '0 0 16px rgba(79,190,142,0.35)' }
    if (val >= 50) return { primary: '#3b82f6', soft: 'rgba(59,130,246,0.14)', glow: '0 0 16px rgba(59,130,246,0.35)' }
    return { primary: '#ff6a2c', soft: 'rgba(255,106,44,0.14)', glow: '0 0 16px rgba(255,106,44,0.35)' }
  }

  const colors = getThemeColors(fillPercent)

  const getBadgeConfig = (val) => {
    if (val >= 75) {
      return {
        label: 'TRUSTED LEGEND',
        icon: '👑',
        background: 'linear-gradient(135deg, rgba(79,190,142,0.12) 0%, rgba(79,190,142,0.28) 100%)',
        borderColor: 'rgba(79,190,142,0.35)',
        color: '#4fbe8e',
        glow: '0 0 10px rgba(79,190,142,0.25)'
      }
    }
    if (val >= 50) {
      return {
        label: 'VERIFIED EXPLORER',
        icon: '🛡️',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.28) 100%)',
        borderColor: 'rgba(59,130,246,0.35)',
        color: '#3b82f6',
        glow: 'none'
      }
    }
    return {
      label: 'NEW SEED',
      icon: '🌱',
      background: 'linear-gradient(135deg, rgba(107,117,124,0.12) 0%, rgba(107,117,124,0.28) 100%)',
      borderColor: 'rgba(107,117,124,0.35)',
      color: '#9ba6ad',
      glow: 'none'
    }
  }

  const badge = getBadgeConfig(activeBadgeScore)

  const handleTap = (e) => {
    haptics.lightTap()
    if (onClick) {
      onClick(e)
    } else {
      setShowTooltip((prev) => !prev)
    }
  }

  // SVG parameters
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (fillPercent / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', position: 'relative' }}>
      
      {/* Floating particles rising */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
        <AnimatePresence>
          {particles.map((p) => (
            <motion.span
              key={p.id}
              initial={{ y: p.y, x: p.x, opacity: 1, scale: 0.8 }}
              animate={{ y: p.y - 80, opacity: 0, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              onAnimationComplete={() => {
                setParticles((prev) => prev.filter((item) => item.id !== p.id))
              }}
              style={{
                position: 'absolute',
                fontWeight: '900',
                fontSize: '14px',
                fontFamily: 'var(--font-mono)',
                color: p.color,
                textShadow: `0 0 8px ${p.color}55`
              }}
            >
              {p.value}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Tapping Tooltip Info Panel */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: reduced ? 1 : 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.9, y: 8 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              marginBottom: '12px',
              background: '#1a2129',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f3f1ea',
              fontSize: '11px',
              lineHeight: '1.4',
              padding: '10px 14px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              zIndex: 50,
              textAlign: 'center',
              width: '160px',
              pointerEvents: 'none'
            }}
          >
            This score reflects verified identity status, trip history, and host ratings.
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderWidth: '6px', borderStyle: 'solid', borderColor: '#1a2129 transparent transparent transparent' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG-based circular dial */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleTap}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleTap(e)
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          position: 'relative',
          cursor: 'pointer',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: isHovered ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <svg
          width={size}
          height={size}
          style={{
            transform: 'rotate(-90deg)',
            position: 'absolute',
            top: 0,
            left: 0,
            overflow: 'visible'
          }}
        >
          {/* Shadow Filter */}
          <defs>
            <filter id={`glow-${colors.primary.replace('#', '')}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={colors.primary} floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Underlay Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
          />
          {/* Animated Active Track with dynamic color & glow filter */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 150ms ease, stroke 300ms ease',
              filter: `url(#glow-${colors.primary.replace('#', '')})`
            }}
          />
        </svg>

        {/* Center content panel */}
        <div
          style={{
            width: `${size - strokeWidth * 2 - 4}px`,
            height: `${size - strokeWidth * 2 - 4}px`,
            borderRadius: '50%',
            background: '#1a2129',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none'
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: `${size * 0.28}px`,
              fontWeight: '900',
              color: '#f3f1ea',
              lineHeight: 1,
              textShadow: `0 0 10px ${colors.primary}33`
            }}
          >
            {tickerVal}
          </span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: '700',
              color: '#6b757c',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: '2px'
            }}
          >
            PTS
          </span>
        </div>
      </div>

      {/* Upgraded Modern Badge */}
      <div style={{ height: '24px', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={badge.label + badgeTrigger}
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 40 }}
            transition={{ type: 'spring', stiffness: 350, damping: 18 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              background: badge.background,
              border: '1px solid',
              borderColor: badge.borderColor,
              borderRadius: '100px',
              boxShadow: badge.glow,
              color: badge.color,
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  )
}

export default TrustCircle
export { TrustCircle }
