import React, { useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext.jsx'
import { getAccessToken, BASE_URL } from '../../utils/api.js'
import Avatar from '../common/Avatar.jsx'

/**
 * Sidebar layout specifically for admin routes.
 * Supports live real-time WebSocket push updates across connected administrative sessions.
 */
const AdminLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // All 10 Admin section links
  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'User Operations', icon: '👤' },
    { path: '/admin/reports', label: 'User Reports', icon: '⚠️' },
    { path: '/admin/activity-reports', label: 'Activity Audits', icon: '🚨' },
    { path: '/admin/activities', label: 'All Trips', icon: '🏔️' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { path: '/admin/broadcast', label: 'Push Broadcast', icon: '📣' },
    { path: '/admin/ip-blocks', label: 'Network Blocks', icon: '🔒' },
    { path: '/admin/logs', label: 'Audit Logs', icon: '📝' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' }
  ]

  // Real-time Socket.IO synchronization for active administrators
  useEffect(() => {
    let socket
    try {
      const socketUrl = BASE_URL.replace('/api/v1', '')
      const token = getAccessToken()
      socket = io(socketUrl, {
        auth: { token },
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5
      })

      socket.on('connect', () => {
        console.debug('Admin WebSocket connected to admin:room.')
      })

      const handleEvent = (eventName, payload) => {
        window.dispatchEvent(new CustomEvent('admin:live_update', { detail: { event: eventName, payload } }))

        if (eventName === 'admin:user_status') {
          toast(`Traveler status updated: ${payload.status || 'modified'}`, { icon: '👤' })
        } else if (eventName === 'admin:report_resolved') {
          toast.success(`Report ${payload.reportId?.slice(0, 8)}... marked ${payload.status}`)
        } else if (eventName === 'admin:trip_status') {
          toast(`Trip status updated: ${payload.status}`, { icon: '🏔️' })
        } else if (eventName === 'admin:ip_block') {
          toast(`Network IP block ${payload.action}: ${payload.ip}`, { icon: '🔒' })
        } else if (eventName === 'admin:broadcast') {
          toast.success(`Broadcast push sent to ${payload.recipientsCount || 0} travelers.`)
        } else if (eventName === 'admin:trust_override') {
          toast(`Trust score override: ${payload.newScore} pts`, { icon: '⭐' })
        }
      }

      socket.on('admin:user_status', (data) => handleEvent('admin:user_status', data))
      socket.on('admin:trust_override', (data) => handleEvent('admin:trust_override', data))
      socket.on('admin:report_resolved', (data) => handleEvent('admin:report_resolved', data))
      socket.on('admin:trip_status', (data) => handleEvent('admin:trip_status', data))
      socket.on('admin:ip_block', (data) => handleEvent('admin:ip_block', data))
      socket.on('admin:broadcast', (data) => handleEvent('admin:broadcast', data))

    } catch (err) {
      console.warn('Admin socket init error:', err?.message)
    }

    return () => {
      try {
        if (socket) socket.disconnect()
      } catch (cleanupErr) {
        // silent cleanup
      }
    }
  }, [])

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        background: 'var(--bg)',
        color: 'var(--text-primary)',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden'
      }}
    >
      {/* 📱 MOBILE TOP HEADER BAR (< 768px) */}
      <div 
        className="md:hidden"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: 'var(--bg-alt)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 400
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f3f1ea',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px'
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
          <span style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'var(--font-display)', color: '#f3f1ea' }}>
            Troopp <span style={{ color: 'var(--accent)' }}>Admin</span>
          </span>
        </div>
        <Link
          to="/feed"
          style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--accent)',
            textDecoration: 'none',
            border: '1px solid rgba(255,106,44,0.3)',
            padding: '4px 10px',
            borderRadius: '100px'
          }}
        >
          App Feed
        </Link>
      </div>

      {/* 📱 MOBILE BACKDROP & DRAWER */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 450
          }}
        />
      )}

      {/* 1. LEFT ADMIN SIDEBAR (Desktop fixed + Mobile Drawer) */}
      <aside 
        style={{
          background: 'var(--bg-alt)',
          borderRight: '1px solid var(--border)',
          padding: '24px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          height: '100vh',
          width: '260px',
          minWidth: '260px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          transition: 'transform 200ms ease'
        }}
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 md:z-auto ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border)'
        }}>
          <Link to="/feed" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(155deg, #ff6a2c, #d9481a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: '700',
              fontSize: '16px',
              color: 'white',
              boxShadow: '0 4px 14px rgba(255,106,44,0.35)'
            }}>
              T
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{
                fontSize: '16px',
                fontWeight: '700',
                letterSpacing: '-0.01em',
                fontFamily: 'var(--font-display)',
                color: '#f3f1ea',
                lineHeight: '1.2'
              }}>
                Troopp Admin
              </span>
              <span style={{ fontSize: '10px', color: '#ff6a2c', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Control Center
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Links */}
        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          flex: '1'
        }}>
          {adminLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/admin'}
              onClick={() => setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                color: isActive ? '#ff6a2c' : '#9ba6ad',
                background: isActive ? 'rgba(255,106,44,0.14)' : 'transparent',
                borderLeft: isActive ? '3px solid #ff6a2c' : '3px solid transparent',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontFamily: 'var(--font-display)',
                textDecoration: 'none',
                transition: 'background 150ms ease, color 150ms ease'
              })}
            >
              <span style={{ fontSize: '14px' }}>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User profile section */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 4px' }}>
            <Avatar src={user?.avatar_url} name={user?.name || 'Admin'} size="sm" />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <span style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#f3f1ea',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user?.name || 'Administrator'}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                {user?.email || 'admin@troopp.com'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'border-color 150ms, background 150ms, color 150ms'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
              e.currentTarget.style.background = 'var(--surface)'
              e.currentTarget.style.color = '#f3f1ea'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            🚪 Exit Admin
          </button>
        </div>
      </aside>

      {/* 2. ADMIN PORTAL CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 w-full pt-[56px] md:pt-0 max-w-full overflow-x-hidden">
        <header 
          style={{
            height: '60px',
            background: 'var(--bg-alt)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            boxSizing: 'border-box'
          }}
          className="hidden md:flex"
        >
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            <span>Real-time connected to PostgreSQL & WebSocket synchronization</span>
          </div>
          <Link
            to="/feed"
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#ff6a2c',
              border: '1px solid rgba(255,106,44,0.2)',
              padding: '6px 14px',
              borderRadius: '100px',
              textDecoration: 'none',
              transition: 'background 150ms, border-color 150ms'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,106,44,0.1)'
              e.currentTarget.style.borderColor = 'rgba(255,106,44,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(255,106,44,0.2)'
            }}
          >
            ← Open App Feed
          </Link>
        </header>

        <div style={{ flexGrow: 1, background: 'var(--bg)', padding: '20px clamp(12px, 3vw, 36px) 80px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
export { AdminLayout }

