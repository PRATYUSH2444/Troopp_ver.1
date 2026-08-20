import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { haptics } from '../../utils/haptics.js'
import { useAuth } from '../../context/AuthContext.jsx'
import BottomNav from '../navigation/BottomNav.jsx'
import { useNotifications } from '../../context/NotificationContext.jsx'

/**
 * AppLayout — Main application shell.
 * Exclusively dark mode template aligned to outdoor adventure design system.
 */
const AppLayout = () => {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])



  const handleLogout = async () => {
    haptics.lightTap()
    await logout()
    navigate('/login')
  }

  const NAV_ITEMS = [
    {
      path: '/feed',
      label: 'Activity Feed',
      icon: (
        <svg className="w-[19px] h-[19px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/search',
      label: 'Search Trips',
      icon: (
        <svg className="w-[19px] h-[19px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      path: '/community',
      label: 'Community Boards',
      icon: (
        <svg className="w-[19px] h-[19px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      path: '/activities/create',
      label: 'Create Activity',
      icon: (
        <svg className="w-[19px] h-[19px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      )
    },
    {
      path: '/notifications',
      label: 'Notifications',
      icon: (
        <svg className="w-[19px] h-[19px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
      )
    },
    {
      path: '/profile/me',
      label: 'My Profile',
      icon: (
        <svg className="w-[19px] h-[19px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      )
    },
    {
      path: '/profile/me/settings',
      label: 'Settings',
      icon: (
        <svg className="w-[19px] h-[19px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ]

  if (user?.role === 'admin') {
    NAV_ITEMS.push({
      path: '/admin',
      label: 'Admin Panel',
      icon: (
        <svg className="w-[19px] h-[19px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    })
  }

  const trustScore = user?.trust_score ?? user?.trustScore ?? 0
  const userName = user?.name || 'Explorer'

  const getRingColor = () => {
    if (trustScore >= 75) return '#4fbe8e'
    if (trustScore >= 50) return '#3b82f6'
    return '#6b757c'
  }
  const ringColor = getRingColor()

  return (
    <div className="shell">
      {/* MOBILE STICKY HEADER */}
      <header className="mobile-header">
        <div className="brand">
          <div className="brand-logo-t">T</div>
          <div className="brand-name">Troopp</div>
        </div>
        <button
          className="hamburger-btn"
          onClick={() => {
            haptics.lightTap()
            setIsMobileMenuOpen(!isMobileMenuOpen)
          }}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* MOBILE DRAWER OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="drawer-backdrop"
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 498
              }}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="drawer-container"
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 'min(300px, 80vw)',
                background: '#0c1013',
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                zIndex: 499,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
                paddingTop: 'env(safe-area-inset-top, 0px)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
              }}
            >
              {/* Drawer Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'Space Grotesk', color: '#f3f1ea' }}>Menu</span>
                <button
                  onClick={() => { haptics.lightTap(); setIsMobileMenuOpen(false); }}
                  style={{ background: 'none', border: 'none', color: '#9ba6ad', padding: '6px', cursor: 'pointer' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Drawer Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    Navigation
                  </div>
                  <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {NAV_ITEMS.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '11px 14px',
                          borderRadius: '9px',
                          color: isActive ? '#ff6a2c' : '#9ba6ad',
                          background: isActive ? 'rgba(255,106,44,0.14)' : 'transparent',
                          fontSize: '14.5px',
                          fontWeight: '500',
                          transition: 'background 150ms ease, color 150ms ease',
                          textDecoration: 'none'
                        })}
                      >
                        {item.icon}
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span>{item.label}</span>
                          {item.path === '/notifications' && unreadCount > 0 && (
                            <span style={{
                              background: '#ef4444',
                              color: '#fff',
                              borderRadius: '9999px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: '700',
                              marginLeft: '8px'
                            }}>
                              {unreadCount}
                            </span>
                          )}
                        </span>
                      </NavLink>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Drawer Footer */}
              <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: '#090c0e' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
                    <svg width="38" height="38" viewBox="0 0 38 38" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="19" cy="19" r="16" fill="none" stroke="#212b33" strokeWidth="3.5" />
                      <circle
                        cx="19"
                        cy="19"
                        r="16"
                        fill="none"
                        stroke={ringColor}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray="100"
                        strokeDashoffset={100 - (100 * trustScore) / 100}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontWeight: '600',
                      fontFamily: 'IBM Plex Mono',
                      color: '#f3f1ea'
                    }}>{trustScore}</div>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: '#f3f1ea'
                    }}>{userName}</div>
                    <div style={{ fontSize: '11px', color: '#6b757c', whiteSpace: 'nowrap' }}>
                      Peer Trust Index
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                  title="Log out"
                  style={{
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: '#9ba6ad',
                    width: '34px',
                    height: '34px',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 150ms, color 150ms',
                    flexShrink: 0
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className="sidebar">
        
        {/* BRAND — hidden on mobile via display rule */}
        <div className="brand">
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'linear-gradient(155deg, #ff6a2c, #d9481a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Space Grotesk',
            fontWeight: '700',
            fontSize: '18px',
            boxShadow: '0 4px 14px rgba(255,106,44,0.35)',
            flexShrink: '0',
            color: 'white'
          }}>T</div>
          <div style={{
            fontSize: '19px',
            fontWeight: '600',
            letterSpacing: '-0.01em',
            fontFamily: 'Space Grotesk',
            color: '#f3f1ea'
          }}>Troopp</div>
        </div>

        {/* NAV LINKS */}
        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flex: '1'
        }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => haptics.lightTap()}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '9px',
                color: isActive ? '#ff6a2c' : '#9ba6ad',
                background: isActive ? 'rgba(255,106,44,0.14)' : 'transparent',
                fontSize: '14.5px',
                fontWeight: '500',
                transition: 'background 150ms ease, color 150ms ease',
                textDecoration: 'none'
              })}
            >
              {item.icon}
              <span className="nav-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{item.label}</span>
                {item.path === '/notifications' && unreadCount > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    marginLeft: '8px'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* FOOTER — hidden on mobile */}
        <div className="sidebar-footer">
          {/* Trust score ring SVG */}
          <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="22" cy="22" r="18" fill="none" stroke="#212b33" strokeWidth="4" />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke={ringColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="113"
                strokeDashoffset={113 - (113 * trustScore) / 100}
              />
            </svg>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '600',
              fontFamily: 'IBM Plex Mono',
              color: '#f3f1ea'
            }}>{trustScore}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: '#f3f1ea'
            }}>{userName}</div>
            <div style={{ fontSize: '12px', color: '#6b757c', whiteSpace: 'nowrap' }}>
              Peer Trust Index
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#9ba6ad',
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color 150ms, color 150ms',
              flexShrink: 0
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* MOBILE BOTTOM NAV — hidden on desktop/tablet via media queries */}
      <div className="mobile-only-nav">
        <BottomNav isMobileMenuOpen={isMobileMenuOpen} />
      </div>


    </div>
  )
}

export default AppLayout
export { AppLayout }
