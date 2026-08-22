import React from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Avatar from '../common/Avatar.jsx'

/**
 * Sidebar layout specifically for admin routes.
 * Overhauled to match the premium dark moody theme.
 */
const AdminLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Admin section links
  const adminLinks = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'User Operations', icon: '👤' },
    { path: '/admin/reports', label: 'User Reports', icon: '⚠️' },
    { path: '/admin/activity-reports', label: 'Activity Audits', icon: '🚨' },
    { path: '/admin/ip-blocks', label: 'Network Blocks', icon: '🔒' },
    { path: '/admin/logs', label: 'Audit Logs', icon: '📝' }
  ]

  return (
    <div 
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'row',
        background: 'var(--bg)',
        color: 'var(--text-primary)'
      }}
      className="flex-col md:flex-row"
    >
      {/* 1. LEFT ADMIN SIDEBAR */}
      <aside 
        style={{
          background: 'var(--bg-alt)',
          borderRight: '1px solid var(--border)',
          padding: '28px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          height: '100vh',
          width: 'var(--sidebar-w)',
          position: 'sticky',
          top: 0,
          zIndex: 300,
          boxSizing: 'border-box'
        }}
        className="w-full md:w-64 h-auto md:h-screen"
      >
        {/* Brand */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border)'
        }}>
          <Link to="/feed" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <span style={{
              fontSize: '18px',
              fontWeight: '700',
              letterSpacing: '-0.01em',
              fontFamily: 'var(--font-display)',
              color: '#f3f1ea'
            }}>
              Troopp Admin
            </span>
          </Link>
          <Link to="/feed" className="md:hidden" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Back to App
          </Link>
        </div>

        {/* Links */}
        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          flex: '1'
        }}>
          {adminLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/admin'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: '9px',
                color: isActive ? '#ff6a2c' : '#9ba6ad',
                background: isActive ? 'rgba(255,106,44,0.14)' : 'transparent',
                fontSize: '13px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-display)',
                textDecoration: 'none',
                transition: 'background 150ms ease, color 150ms ease'
              })}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User profile section */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '18px',
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
                {user?.name || 'Grievance Officer'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                System Admin
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '9px',
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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header 
          style={{
            height: '64px',
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
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Troopp grievance, verification, and network moderation panel.
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

        <div style={{ flexGrow: 1, background: 'var(--bg)', padding: '28px clamp(16px, 3.5vw, 40px) 80px', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
export { AdminLayout }
