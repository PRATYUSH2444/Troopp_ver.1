import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './TrooppShowcase.css'

// ==========================================
// 1. PHONE FRAME & SCREEN STATE CONTAINER
// ==========================================
export const TrooppShowcase = () => {
  const [currentScreen, setCurrentScreen] = useState(1)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  // Auto-cycle screen states every 5.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentScreen((prev) => (prev === 4 ? 1 : prev + 1))
    }, 5500)
    return () => clearInterval(timer)
  }, [])

  // Parallax subtle rotation mapping
  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setMousePos({ x: x * 15, y: y * -15 }) // Max 15 deg tilt
  }

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 })
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="showcase-outer-container"
    >
      {/* Dynamic ambient color light blobs behind the phone */}
      <div className="showcase-ambient-glow" />

      {/* 3 Supporting Floating Cards */}
      <AnimatePresence>
        {/* Floating Card 1: Trust Score Gauge */}
        <FloatingCard 
          key="trust-widget" 
          delay={0}
          className="float-card-trust"
          xOffset={-140}
          yOffset={-100}
        >
          <div className="float-card-header">
            <span className="dot-green" /> TRUST METRICS
          </div>
          <div className="float-card-body">
            <div className="float-score-label">Average Member Score</div>
            <div className="float-score-val">
              <span className="gradient-orange">94.8</span>
              <span className="float-score-max">/100</span>
            </div>
            <div className="float-badge-outline">🛡️ HIGHLY RELIABLE</div>
          </div>
        </FloatingCard>

        {/* Floating Card 2: Verification Status */}
        <FloatingCard 
          key="verification-widget" 
          delay={0.4}
          className="float-card-verify"
          xOffset={150}
          yOffset={-40}
        >
          <div className="float-card-header">
            <span className="dot-orange" /> IDENTITY GATEWAY
          </div>
          <div className="float-card-body flex-row">
            <div className="shield-icon-container">
              <svg width="18" height="18" fill="none" stroke="#4fbe8e" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            <div>
              <div className="float-title-sm">Digio Verification</div>
              <div className="float-desc-sm">ID Matches Confirmed</div>
            </div>
          </div>
        </FloatingCard>

        {/* Floating Card 3: Live SOS Safety Alerts */}
        <FloatingCard 
          key="safety-widget" 
          delay={0.8}
          className="float-card-safety"
          xOffset={-120}
          yOffset={120}
        >
          <div className="float-card-header">
            <span className="dot-red" /> EMERGENCY SOS
          </div>
          <div className="float-card-body flex-row">
            <div className="sos-badge">LIVE GPS</div>
            <div>
              <div className="float-title-sm" style={{ color: '#ff5470' }}>Safety Check-in</div>
              <div className="float-desc-sm">All waypoints logged</div>
            </div>
          </div>
        </FloatingCard>
      </AnimatePresence>

      {/* The Smartphone container with tilt physics */}
      <motion.div 
        style={{
          rotateX: mousePos.y,
          rotateY: mousePos.x,
          transformStyle: 'preserve-3d'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
        className="phone-showcase-wrapper"
      >
        <PhoneFrame>
          <AnimatePresence mode="wait">
            {currentScreen === 1 && (
              <motion.div
                key="screen-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="phone-screen-content"
              >
                <VerificationScreen />
              </motion.div>
            )}
            {currentScreen === 2 && (
              <motion.div
                key="screen-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="phone-screen-content"
              >
                <ActivityFeedScreen />
              </motion.div>
            )}
            {currentScreen === 3 && (
              <motion.div
                key="screen-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="phone-screen-content"
              >
                <TripRoomScreen />
              </motion.div>
            )}
            {currentScreen === 4 && (
              <motion.div
                key="screen-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="phone-screen-content"
              >
                <CompletionScreen />
              </motion.div>
            )}
          </AnimatePresence>
        </PhoneFrame>
      </motion.div>
    </div>
  )
}

// ==========================================
// 2. PHONE FRAME OUTER CASING
// ==========================================
const PhoneFrame = ({ children }) => {
  return (
    <div className="phone-device-container">
      {/* Outer Metallic Edge */}
      <div className="phone-metallic-edge" />
      {/* Screen Bezel */}
      <div className="phone-bezel">
        {/* Dynamic Island */}
        <div className="phone-dynamic-island">
          <div className="island-camera" />
        </div>
        {/* Screen Display Body */}
        <div className="phone-display">
          {children}
        </div>
      </div>
      {/* Glass reflections overlay */}
      <div className="phone-glass-shine" />
    </div>
  )
}

// ==========================================
// 3. FLOATING GLASS CARD WRAPPER
// ==========================================
const FloatingCard = ({ children, delay = 0, className = '', xOffset = 0, yOffset = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: yOffset + 15, x: xOffset }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        x: xOffset,
        y: [yOffset, yOffset - 8, yOffset],
        rotate: [0, 0.5, -0.5, 0]
      }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: {
          repeat: Infinity,
          duration: 4,
          ease: 'easeInOut',
          delay: delay * 0.5
        },
        rotate: {
          repeat: Infinity,
          duration: 6,
          ease: 'easeInOut',
          delay: delay * 0.3
        }
      }}
      className={`floating-glass-card ${className}`}
    >
      {children}
    </motion.div>
  )
}

// ==========================================
// SCREEN 1: Verification Screen Component
// ==========================================
const VerificationScreen = () => {
  const [percent, setPercent] = useState(0)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setPercent((prev) => (prev >= 100 ? 100 : prev + 4))
    }, 100)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="screen-layout-vertical justify-space-between">
      {/* Screen Header */}
      <div className="app-screen-header">
        <span className="app-title-sm">Security Gateway</span>
      </div>

      {/* Face Scan Vector Outline */}
      <div className="face-scan-box">
        <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1">
          <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
        <motion.div 
          className="face-scan-laser"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        />
        {/* Animated Vector Face */}
        <div className="face-shape-outline">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff6a2c" strokeWidth="2">
            <path strokeLinecap="round" d="M9 10h.01M15 10h.01M10 16c.5 1 1.5 1.5 2 1.5s1.5-.5 2-1.5" />
            <rect width="18" height="18" x="3" y="3" rx="9" />
          </svg>
        </div>
      </div>

      {/* Verification Stats / Progress rings */}
      <div className="progress-section-container">
        <div className="ring-container">
          <svg className="progress-ring-svg" width="48" height="48">
            <circle className="ring-track" cx="24" cy="24" r="18" />
            <motion.circle 
              className="ring-bar-emerald" 
              cx="24" 
              cy="24" 
              r="18" 
              strokeDasharray={2 * Math.PI * 18}
              strokeDashoffset={2 * Math.PI * 18 * (1 - percent / 100)}
            />
          </svg>
          <div className="ring-text-overlay">{percent}%</div>
        </div>

        <div className="progress-text-block">
          <div className="progress-title-text">KYC Verification</div>
          <div className="progress-desc-text">Digio biometric check matching...</div>
        </div>
      </div>

      {/* Incrementing Trust Badge */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={percent === 100 ? { opacity: 1, y: 0 } : {}}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="screen-success-pill"
      >
        <span className="success-badge-icon">✓</span>
        <span className="success-badge-text">PROFILE COMPLETED</span>
      </motion.div>
    </div>
  )
}

// ==========================================
// SCREEN 2: Discovery Feed Component
// ==========================================
const ActivityFeedScreen = () => {
  return (
    <div className="screen-layout-vertical">
      {/* Header Search bar */}
      <div className="app-screen-header">
        <div className="mock-search-bar">
          <span className="search-icon-sm">🔍</span> Search college trips...
        </div>
      </div>

      {/* Category Chips row */}
      <div className="mock-chips-row">
        <div className="mock-chip-active">🎒 All</div>
        <div className="mock-chip">🏔 Trek</div>
        <div className="mock-chip">🚗 Drive</div>
        <div className="mock-chip">⛺ Camp</div>
      </div>

      {/* Scrollable list preview */}
      <div className="mock-scroll-feed">
        <motion.div 
          className="mock-scroll-track"
          animate={{ y: [0, -135, 0] }}
          transition={{ repeat: Infinity, duration: 7.5, ease: 'easeInOut' }}
        >
          <div className="mock-feed-card border-green-glow">
            <div className="feed-card-header">
              <span className="feed-card-tag emerald-tag">🏔 TREK</span>
              <span className="feed-card-badge">⭐ 4.9</span>
            </div>
            <div className="feed-card-title">Weekend Trek to Nandi Hills</div>
            <div className="feed-card-info">Host: Aarav (Score: 96)</div>
            <div className="feed-card-action-row">
              <div className="avail-slots">4 seats left</div>
              <button className="join-btn-mock">Request Join</button>
            </div>
          </div>

          <div className="mock-feed-card border-orange-glow">
            <div className="feed-card-header">
              <span className="feed-card-tag orange-tag">🚗 DRIVE</span>
              <span className="feed-card-badge">⭐ 4.8</span>
            </div>
            <div className="feed-card-title">Sunrise Drive to Highway Loops</div>
            <div className="feed-card-info">Host: Kiara (Score: 92)</div>
            <div className="feed-card-action-row">
              <div className="avail-slots">2 seats left</div>
              <button className="join-btn-mock">Request Join</button>
            </div>
          </div>

          <div className="mock-feed-card border-cyan-glow">
            <div className="feed-card-header">
              <span className="feed-card-tag cyan-tag">⛺ CAMP</span>
              <span className="feed-card-badge">⭐ 5.0</span>
            </div>
            <div className="feed-card-title">Wilderness Stay at Riverside</div>
            <div className="feed-card-info">Host: Dev (Score: 98)</div>
            <div className="feed-card-action-row">
              <div className="avail-slots">5 seats left</div>
              <button className="join-btn-mock">Request Join</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ==========================================
// SCREEN 3: Trip Room Chat & Splits Component
// ==========================================
const TripRoomScreen = () => {
  return (
    <div className="screen-layout-vertical justify-space-between">
      {/* Room title */}
      <div className="app-screen-header flex-row justify-space-between">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="app-title-sm" style={{ fontSize: '13px' }}>Nandi Hills Expedition</span>
          <span className="avatar-group-count">4 co-travelers active</span>
        </div>
        {/* Avatars Stack */}
        <div className="mini-avatar-stack">
          <div className="mini-avatar av-1">A</div>
          <div className="mini-avatar av-2">K</div>
          <div className="mini-avatar av-3">+1</div>
        </div>
      </div>

      {/* GPS Map preview */}
      <div className="gps-preview-map">
        <div className="gps-route-line" />
        <div className="gps-pulse-dot dot-origin" />
        <motion.div 
          className="gps-pulse-dot dot-car"
          animate={{ left: ['15%', '85%', '15%'], top: ['75%', '25%', '75%'] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        />
        <div className="gps-panel-info">Enroute waypoints (2.4 km left)</div>
      </div>

      {/* Message Chat Bubbles */}
      <div className="mock-chat-container">
        <div className="chat-msg bubble-left">
          <div className="chat-sender">Aarav</div>
          <div className="chat-text">Just crossed checkpoint 2!</div>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="chat-msg bubble-right"
        >
          <div className="chat-sender">You</div>
          <div className="chat-text">Awesome, see you there!</div>
        </motion.div>
        
        {/* Split Expense Alert box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.2 }}
          className="split-expense-alert"
        >
          <div className="expense-head">💸 EXPENSE SPLIT</div>
          <div className="expense-body">Aarav added ₹1,200 (Fuel). You owe ₹300.</div>
        </motion.div>

        {/* Typing indicator */}
        <div className="typing-indicator">
          <span></span><span></span><span></span>
          <span className="typing-text">Kiara is typing...</span>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// SCREEN 4: Trip Completion Success Component
// ==========================================
const CompletionScreen = () => {
  const [score, setScore] = useState(65)

  useEffect(() => {
    const delay = setTimeout(() => {
      const interval = setInterval(() => {
        setScore((prev) => (prev >= 95 ? 95 : prev + 1))
      }, 35)
      return () => clearInterval(interval)
    }, 800)
    return () => clearTimeout(delay)
  }, [])

  return (
    <div className="screen-layout-vertical justify-space-between text-center align-center">
      {/* Dynamic Success Ring */}
      <div className="success-lottie-ring">
        <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="#4fbe8e" strokeWidth="2">
          <circle cx="12" cy="12" r="9" style={{ opacity: 0.15 }} />
          <motion.circle 
            cx="12" 
            cy="12" 
            r="9" 
            strokeDasharray={2 * Math.PI * 9}
            initial={{ strokeDashoffset: 2 * Math.PI * 9 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 10 }}
          className="success-checkmark-overlay"
        >
          🏆
        </motion.div>
      </div>

      <div className="completion-headers">
        <h4 className="completion-title">Trip Completed!</h4>
        <p className="completion-subtitle">Reputation points captured successfully</p>
      </div>

      {/* Trust score dynamic count */}
      <div className="reputation-score-box">
        <div className="score-label">TRUST REPUTATION</div>
        <div className="score-flex-val">
          <span className="score-count">{score}</span>
          <span className="score-addon">/100</span>
        </div>
        <div className="score-added-pill">+15 points earned</div>
      </div>

      {/* Community Review Rating stars */}
      <div className="completion-review-stars">
        <span className="star-active">★</span>
        <span className="star-active">★</span>
        <span className="star-active">★</span>
        <span className="star-active">★</span>
        <span className="star-active">★</span>
        <div className="review-label">5.0 Excellent Co-traveler rating</div>
      </div>
    </div>
  )
}

export default TrooppShowcase
