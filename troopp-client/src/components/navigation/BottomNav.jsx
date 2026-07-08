import React, { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import { haptics } from '../../utils/haptics.js'

function DockItem({ children, className = '', onClick, mouseX, spring, distance, magnification, baseItemSize, label, isActive }) {
  const ref = useRef(null)
  const isHovered = useMotionValue(0)

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize
    }
    return val - rect.x - baseItemSize / 2
  })

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize])
  const size = useSpring(targetSize, spring)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <motion.div
      ref={ref}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        cursor: 'pointer',
        outline: 'none',
        position: 'relative',
        background: isActive ? 'rgba(255,106,44,0.14)' : '#1a2129',
        border: isActive ? '1.5px solid #ff6a2c' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isActive ? '0 4px 12px rgba(255,106,44,0.2)' : '0 4px 10px rgba(0,0,0,0.3)',
        transition: 'background 200ms ease, border-color 200ms ease'
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-haspopup="true"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {Children.map(children, (child) => cloneElement(child, { isHovered, isActive }))}
    </motion.div>
  )
}

function DockLabel({ children, className = '', ...rest }) {
  const { isHovered } = rest
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const unsubscribe = isHovered.on('change', (latest) => {
      setIsVisible(latest === 1)
    })
    return () => unsubscribe()
  }, [isHovered])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.85 }}
          animate={{ opacity: 1, y: -8, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.85 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'auto',
            whiteSpace: 'pre',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.08)',
            backgroundColor: '#1a2129',
            padding: '4px 8px',
            fontSize: '10px',
            fontWeight: '700',
            color: '#f3f1ea',
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 1100
          }}
          role="tooltip"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DockIcon({ children, className = '', ...rest }) {
  const { isActive } = rest
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isActive ? '#ff6a2c' : '#9ba6ad',
        transition: 'color 200ms ease'
      }}
    >
      {children}
    </div>
  )
}

const BottomNav = ({
  isMobileMenuOpen = false,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 64,
  distance = 150,
  panelHeight = 60,
  dockHeight = 100,
  baseItemSize = 44
}) => {
  const navigate = useNavigate()
  const location = useLocation()

  const mouseX = useMotionValue(Infinity)
  const isHovered = useMotionValue(0)

  // Hide inside Trip Room chat
  if (location.pathname.startsWith('/trip-rooms/')) return null

  const navLinks = [
    {
      path: '/feed',
      label: 'Feed',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/search',
      label: 'Search',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      path: '/activities/create',
      label: 'Create',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      )
    },
    {
      path: '/notifications',
      label: 'Alerts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      )
    },
    {
      path: '/profile/me',
      label: 'Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      )
    }
  ]

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + 8),
    [magnification, dockHeight]
  )
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight])
  const height = useSpring(heightRow, spring)

  return (
    <AnimatePresence>
      {!isMobileMenuOpen && (
        <motion.div
          initial={{ y: 120, x: '-50%', opacity: 0 }}
          animate={{ y: 0, x: '-50%', opacity: 1 }}
          exit={{ y: 120, x: '-50%', opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 210 }}
          style={{
            position: 'fixed',
            bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
            left: '50%',
            zIndex: 490, // Positioned below mobile drawer backdrop (498) to prevent touch and layering conflicts
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            width: '100%',
            maxWidth: '480px',
            padding: '0 16px'
          }}
        >
          <motion.div
            style={{
              height,
              scrollbarWidth: 'none',
              pointerEvents: 'auto',
              background: 'rgba(12, 16, 19, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '100px',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)'
            }}
          >
            <motion.div
              onMouseMove={({ pageX }) => {
                isHovered.set(1)
                mouseX.set(pageX)
              }}
              onMouseLeave={() => {
                isHovered.set(0)
                mouseX.set(Infinity)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                height: '100%'
              }}
              role="toolbar"
              aria-label="Application dock"
            >
              {navLinks.map((item, index) => {
                const isActive = location.pathname === item.path
                return (
                  <DockItem
                    key={index}
                    onClick={() => {
                      haptics.lightTap()
                      navigate(item.path)
                    }}
                    mouseX={mouseX}
                    spring={spring}
                    distance={distance}
                    magnification={magnification}
                    baseItemSize={baseItemSize}
                    label={item.label}
                    isActive={isActive}
                  >
                    <DockIcon>{item.icon}</DockIcon>
                    <DockLabel>{item.label}</DockLabel>
                  </DockItem>
                )
              })}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BottomNav
export { BottomNav }
