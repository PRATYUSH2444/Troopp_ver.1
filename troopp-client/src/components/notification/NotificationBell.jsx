import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../../context/NotificationContext.jsx'

/**
 * Animated Notification Bell button in headers.
 */
const NotificationBell = () => {
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="w-10 h-10 border border-border rounded-xl bg-white hover:bg-stone-50 flex items-center justify-center relative cursor-pointer shadow-sm transition-all"
      aria-label="View notifications"
    >
      {/* Bell Icon SVG */}
      <svg
        className="w-5 h-5 text-text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Red Count Badge with scale animation */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.div
            key={unreadCount}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white font-extrabold text-[8px] flex items-center justify-center border border-white leading-none shadow-sm"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}

export default NotificationBell
export { NotificationBell }
