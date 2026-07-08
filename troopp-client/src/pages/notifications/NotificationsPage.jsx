import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext.jsx'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * Renders notifications history list with deep-link redirection paths.
 */
const NotificationsPage = () => {
  const navigate = useNavigate()
  const { notificationList, setNotificationList, markAllAsRead } = useNotifications()
  const [loading, setLoading] = useState(true)

  // 1. Mark notifications read on mount and fetch list
  useEffect(() => {
    const syncNotifications = async () => {
      try {
        // Mock fetch list: axios.get('/api/v1/notifications')
        await new Promise((r) => setTimeout(r, 500))

        // Set default list if empty for seed demonstration
        if (notificationList.length === 0) {
          setNotificationList([
            {
              id: 'notif-1',
              type: 'join_request_approved',
              title: 'Trek Approved! 🎉',
              body: 'Raj Malhotra approved your join request for: Harishchandragad Monsoon Trek.',
              createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
              is_read: false,
              data: { deepLink: '/trip-rooms/a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7' }
            },
            {
              id: 'notif-2',
              type: 'trust_score_changed',
              title: 'Trust Score Increased! 📈',
              body: 'Your safety trust score bumped to 83 (+3 points) for completing post-trip ratings.',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
              is_read: true,
              data: { deepLink: '/profile/me' }
            },
            {
              id: 'notif-3',
              type: 'new_activity_in_city',
              title: 'New Trip nearby 🗺️',
              body: 'A cycling trip "Saturday Morning Lonavala Spin" was created in Pune.',
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
              is_read: true,
              data: { deepLink: '/activities/34343434-3434-3434-3434-343434343434' }
            }
          ])
        }

        await markAllAsRead()
      } catch (err) {
        console.error('Failed syncing notifications list:', err)
      } finally {
        setLoading(false)
      }
    }

    syncNotifications()
  }, [])

  // Icon mapping helper
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_activity_in_city':
        return '🎒'
      case 'join_request_received':
        return '📥'
      case 'join_request_approved':
        return '✅'
      case 'join_request_declined':
        return '❌'
      case 'trip_announcement':
        return '📢'
      case 'trust_score_changed':
      case 'reliability_score_changed':
        return '📈'
      case 'user_followed':
        return '👤'
      case 'sos_triggered':
      case 'emergency_alert':
        return '🚨'
      default:
        return '🔔'
    }
  }

  // Format relative timestamp helper
  const getRelativeTime = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / (1000 * 60))
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleNotificationTap = (notif) => {
    const link = notif.data?.deepLink || '/feed'
    navigate(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-5 pb-20 px-4">
      {/* Header title */}
      <div className="flex flex-col mt-4">
        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">
          Platform Updates
        </span>
        <h2 className="text-sm font-extrabold text-text-primary leading-tight">
          Notifications
        </h2>
      </div>

      {notificationList.length === 0 ? (
        <div className="text-center py-20 bg-stone-50/50 border border-border/80 border-dashed rounded-2xl flex flex-col items-center gap-2">
          <span className="text-3xl">📭</span>
          <h4 className="text-xs font-bold text-text-primary">You're all caught up!</h4>
          <p className="text-[10px] text-text-secondary max-w-xs leading-relaxed">
            No new activity or alerts. Updates regarding upcoming trips and scores show up here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {notificationList.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationTap(notif)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3.5 items-start ${
                notif.is_read
                  ? 'bg-surface border-border/60 hover:bg-stone-50/50'
                  : 'bg-stone-50 border-stone-250 hover:bg-stone-100/50 shadow-sm'
              }`}
            >
              {/* Type category icon */}
              <div className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-sm shadow-inner">
                {getNotificationIcon(notif.type)}
              </div>

              {/* Message text details */}
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-extrabold text-text-primary leading-tight">
                    {notif.title}
                  </span>
                  <span className="text-[8px] text-text-secondary font-bold flex-shrink-0">
                    {getRelativeTime(notif.createdAt)}
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary mt-1 leading-snug">
                  {notif.body}
                </p>
              </div>

              {/* Unread dot notification */}
              {!notif.is_read && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
export { NotificationsPage }
