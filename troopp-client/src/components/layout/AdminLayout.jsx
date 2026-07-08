import React from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Avatar from '../common/Avatar.jsx'

/**
 * Sidebar layout specifically for admin routes.
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
    { path: '/admin/verification-queue', label: 'ID Queue', icon: '🪪' },
    { path: '/admin/ip-blocks', label: 'Network Blocks', icon: '🔒' },
    { path: '/admin/logs', label: 'Audit Logs', icon: '📝' }
  ]

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row">
      {/* 1. LEFT ADMIN SIDEBAR */}
      <aside className="w-full md:w-64 bg-stone-900 text-stone-100 flex flex-col h-auto md:h-screen md:sticky top-0 p-5 z-20 shadow-xl">
        {/* Brand */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-800">
          <Link to="/feed" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-base font-bold">
              T
            </div>
            <span className="text-lg font-heading font-bold text-white tracking-tight">
              Troopp Admin
            </span>
          </Link>
          <Link to="/feed" className="text-xs text-stone-400 hover:text-white md:hidden">
            Back to App
          </Link>
        </div>

        {/* Links */}
        <nav className="flex-1 flex flex-col gap-1">
          {adminLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-stone-400 hover:bg-stone-800 hover:text-stone-100'
                }`
              }
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User profile section */}
        <div className="border-t border-stone-800 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 px-1">
            <Avatar src={user?.avatar_url} name={user?.name || 'Admin'} size="sm" />
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-white truncate leading-tight">
                {user?.name}
              </span>
              <span className="text-[10px] text-stone-400">
                Grievance Officer
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full h-9 flex items-center justify-center gap-2 text-xs font-bold text-stone-400 border border-stone-800 hover:bg-stone-800 hover:text-white rounded-lg transition-colors"
          >
            🚪 Exit
          </button>
        </div>
      </aside>

      {/* 2. ADMIN PORTAL CONTENT */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-border hidden md:flex items-center justify-between px-6 shadow-sm">
          <div className="text-sm font-semibold text-text-primary">
            Troopp grievance, verification, and network moderation panel.
          </div>
          <Link
            to="/feed"
            className="text-xs font-bold text-primary hover:text-primary-dark border border-primary/20 hover:border-primary/50 px-3.5 py-1.5 rounded-lg transition-colors"
          >
            ← Open Main App Feed
          </Link>
        </header>

        <div className="flex-grow p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
export { AdminLayout }
