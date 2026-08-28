import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { haptics } from '../../utils/haptics.js'
import { useAuth } from '../../context/AuthContext.jsx'
import BottomNav from '../navigation/BottomNav.jsx'
import { useNotifications } from '../../context/NotificationContext.jsx'
import { toast } from 'react-hot-toast'

/**
 * AppLayout — Modern Expedition Application Shell.
 * Directly matches the reference design with Top Search Bar, Navigation Rail,
 * Go Premium CTA, Trip Room Code Share, and user profile badges.
 */
const AppLayout = () => {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    haptics.lightTap()
    await logout()
    navigate('/login')
  }

  const NAV_ITEMS = [
    {
      path: '/feed',
      label: 'Trip Rooms',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/itinerary',
      label: 'Itinerary',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      )
    },
    {
      path: '/checkpoints',
      label: 'Checkpoints',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      )
    },
    {
      path: '/community',
      label: 'Travelers',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      path: '/packing',
      label: 'Packing List',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7h-3V5a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1zM9 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2H9z" />
        </svg>
      )
    },
    {
      path: '/polls',
      label: 'Polls',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      )
    },
    {
      path: '/chat',
      label: 'Chat',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      path: '/search',
      label: 'Maps',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0 0 21 18.618V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    {
      path: '/expenses',
      label: 'Expenses',
      badge: 'Soon',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    {
      path: '/documents',
      label: 'Documents',
      badge: 'Soon',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: '/profile/me/settings',
      label: 'Settings',
      icon: (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ]

  const userName = user?.name || user?.Profile?.name || 'Dev Shrivastav'
  const userAvatar = user?.avatar_url || user?.Profile?.avatar_url
  const isHost = true

  const handleCopyCode = () => {
    haptics.lightTap()
    navigator.clipboard.writeText('TUN-2026')
    toast.success('Trip Room Code copied!')
  }

  const handleShare = () => {
    haptics.lightTap()
    if (navigator.share) {
      navigator.share({ title: 'Troopp Expedition', text: 'Join my trip room with code TUN-2026', url: window.location.href })
    } else {
      handleCopyCode()
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0e17] text-[#f3f4f8] flex flex-col font-sans">
      
      {/* =========================================================================
          GLOBAL TOP NAVIGATION BAR
          ========================================================================= */}
      <header className="h-16 bg-[#0f1422] border-b border-[#1a2234] sticky top-0 z-50 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left Brand */}
        <div className="flex items-center gap-3">
          <Link to="/feed" className="flex items-center gap-2.5 text-[#f3f4f8] hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#4f46e5] flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.35)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L1 21h22L12 2zm0 3.8L19.5 19h-15L12 5.8z"/>
              </svg>
            </div>
            <span className="font-bold text-base tracking-wider uppercase font-display hidden sm:inline-block">
              EXPEDITION
            </span>
          </Link>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-md hidden md:flex items-center relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search trips, rooms, travelers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141a29] border border-[#1e2638] text-sm text-[#f3f4f8] placeholder-[#64748b] pl-10 pr-4 py-2 rounded-xl focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none transition-all"
          />
        </div>

        {/* Right Actions & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Quick Chat Icon */}
          <Link
            to="/chat"
            className="w-9 h-9 rounded-xl bg-[#141a29] hover:bg-[#1c2438] border border-[#1e2638] flex items-center justify-center text-[#94a3b8] hover:text-[#f3f4f8] transition-colors relative"
            title="Messages"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </Link>

          {/* Notifications with Badge */}
          <Link
            to="/notifications"
            className="w-9 h-9 rounded-xl bg-[#141a29] hover:bg-[#1c2438] border border-[#1e2638] flex items-center justify-center text-[#94a3b8] hover:text-[#f3f4f8] transition-colors relative"
            title="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ef4444] text-[10px] font-black text-white flex items-center justify-center shadow-sm">
              {unreadCount > 0 ? unreadCount : 3}
            </span>
          </Link>

          {/* Theme Moon Toggle */}
          <button
            onClick={() => haptics.lightTap()}
            className="w-9 h-9 rounded-xl bg-[#141a29] hover:bg-[#1c2438] border border-[#1e2638] flex items-center justify-center text-[#94a3b8] hover:text-[#f3f4f8] transition-colors cursor-pointer"
            title="Toggle theme"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>

          <div className="h-6 w-px bg-[#1a2234] hidden sm:block" />

          {/* User Profile Header Chip */}
          <Link
            to="/profile/me"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity p-1 rounded-xl"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#f43f5e] to-[#fb7185] flex items-center justify-center font-bold text-xs text-white overflow-hidden ring-2 ring-[#6366f1]/40">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-[#f3f4f8] leading-tight truncate max-w-[120px]">
                {userName}
              </span>
              <span className="text-[10.5px] text-[#64748b] font-medium flex items-center gap-1">
                Host
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </span>
            </div>
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl bg-[#141a29] border border-[#1e2638] flex items-center justify-center text-[#f3f4f8]"
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </header>

      {/* =========================================================================
          APPLICATION BODY (SIDEBAR + MAIN CONTENT)
          ========================================================================= */}
      <div className="flex-1 flex overflow-x-hidden">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="w-[240px] bg-[#0f1422] border-r border-[#1a2234] flex-shrink-0 sticky top-16 h-[calc(100vh-64px)] hidden md:flex flex-col justify-between p-3.5 overflow-y-auto">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isTripRoomsActive = item.path === '/feed' && (location.pathname.startsWith('/trip-rooms') || location.pathname === '/feed')
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => {
                    const active = isTripRoomsActive || isActive
                    return `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all ${
                      active
                        ? 'bg-[#1e2238] text-[#a5b4fc] font-semibold border-l-2 border-[#6366f1]'
                        : 'text-[#94a3b8] hover:text-[#f3f4f8] hover:bg-[#141a29]'
                    }`
                  }}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] uppercase font-bold text-[#64748b] bg-[#141a29] border border-[#1e2638] px-2 py-0.5 rounded-md">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>

          {/* LOWER SIDEBAR MODULES: Go Premium + Trip Room Code + Support */}
          <div className="flex flex-col gap-3 pt-4 border-t border-[#1a2234] mt-3">
            {/* Go Premium Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#181d33] to-[#121626] border border-[#232a48] relative overflow-hidden shadow-lg">
              <div className="absolute top-2 right-2 text-xl opacity-80">🏔️</div>
              <div className="font-bold text-xs text-[#f3f4f8] mb-1 font-display">Go Premium</div>
              <p className="text-[11px] text-[#94a3b8] leading-tight mb-3">
                Unlock advanced features and tools for your expeditions.
              </p>
              <button
                onClick={() => {
                  haptics.lightTap()
                  toast.success('Expedition Premium pass features activated!')
                }}
                className="w-full py-1.5 px-3 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer text-center"
              >
                Upgrade Now
              </button>
            </div>

            {/* Trip Room Code Card */}
            <div className="p-3 bg-[#141a29] border border-[#1e2638] rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono font-bold text-[#64748b]">Trip Room Code</div>
                <div className="font-mono font-bold text-xs text-[#f3f4f8] mt-0.5">TUN-2026</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f3f4f8] hover:bg-[#1e2638] transition-colors"
                  title="Share Code"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f3f4f8] hover:bg-[#1e2638] transition-colors"
                  title="Copy Code"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Need Help link */}
            <div className="flex items-center gap-2 px-1 text-xs">
              <span className="text-[#64748b]">💬 Need help?</span>
              <a href="mailto:support@troopp.com" className="text-[#818cf8] hover:underline font-semibold">
                Contact Support
              </a>
            </div>
          </div>
        </aside>

        {/* MAIN OUTLET CONTAINER */}
        <main className="flex-1 min-w-0 max-w-full bg-[#0b0e17] p-4 sm:p-6 lg:p-7 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden">
        <BottomNav isMobileMenuOpen={isMobileMenuOpen} />
      </div>

    </div>
  )
}

export default AppLayout
export { AppLayout }
