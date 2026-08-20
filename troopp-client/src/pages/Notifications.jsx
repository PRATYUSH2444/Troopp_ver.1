import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useNotifications } from '../context/NotificationContext.jsx'
import { haptics } from '../utils/haptics.js'
import Spinner from '../components/common/Spinner.jsx'

/**
 * Premium Notifications page conforming to Section 3.6 specs.
 */
const Notifications = () => {
  const navigate = useNavigate()
  const { notificationList, fetchNotifications, markAllAsRead, markAsRead } = useNotifications()
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState(null)

  useEffect(() => {
    const syncNotifications = async () => {
      try {
        await fetchNotifications()
      } catch (err) {
        console.error('Failed syncing notifications list:', err)
      } finally {
        setLoading(false)
      }
    }
    syncNotifications()
  }, [])

  // Icon mapping helper
  const getNotificationIconDetails = (type) => {
    switch (type) {
      case 'join_request_approved':
        return {
          bg: 'rgba(79,190,142,0.14)',
          color: '#4fbe8e',
          icon: (
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )
        }
      case 'trust_score_changed':
      case 'reliability_score_changed':
        return {
          bg: 'rgba(59,130,246,0.14)',
          color: '#3b82f6',
          icon: (
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          )
        }
      case 'new_activity_in_city':
        return {
          bg: 'rgba(255,106,44,0.14)',
          color: '#ff6a2c',
          icon: (
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
            </svg>
          )
        }
      case 'sos_triggered':
      case 'emergency_alert':
        return {
          bg: 'rgba(255,84,112,0.14)',
          color: '#ff5470',
          icon: (
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          )
        }
      default:
        return {
          bg: 'rgba(255,106,44,0.14)',
          color: '#ff6a2c',
          icon: (
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.195-.39.771-.39.965 0l2.582 5.23 5.76.84c.43.063.602.592.29.896l-4.167 4.06.983 5.736c.073.43-.377.758-.763.55L11.5 18.064l-5.146 2.704c-.386.208-.836-.12-.763-.55l.983-5.736-4.167-4.06c-.312-.304-.14-.833.29-.896l5.76-.84 2.582-5.23z" />
            </svg>
          )
        }
    }
  }

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
    haptics.lightTap()
    markAsRead(notif.id)
    const link = notif.data?.deepLink || '/feed'
    navigate(link)
  }

  const handleMarkAllRead = () => {
    haptics.lightTap()
    markAllAsRead()
    toast.success('All notifications marked as read!')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#10151a' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#10151a', padding: '28px 40px 80px' }}>
      <div style={{ width: '100%', maxWidth: '896px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', userSelect: 'none' }}>
        
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 20px 0' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '26px',
              fontWeight: '700',
              color: '#f3f1ea',
              margin: 0,
              letterSpacing: '-0.01em'
            }}
          >
            Notifications
          </h1>
          <button
            onClick={handleMarkAllRead}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '13px',
              fontWeight: '600',
              color: '#ff6a2c',
              cursor: 'pointer'
            }}
          >
            Mark all read
          </button>
        </div>

        {notificationList.length === 0 ? (
          /* Caught up state */
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: '#1a2129',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ fontSize: '50px', marginBottom: '8px' }}>📭</div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#f3f1ea', margin: 0 }}>You're all caught up!</h4>
            <p style={{ fontSize: '13px', color: '#9ba6ad', maxWidth: '320px', margin: 0, lineHeight: '1.5' }}>
              No new activity or alerts. Updates regarding upcoming trips and scores show up here.
            </p>
          </div>
        ) : (
          /* Notification list container */
          <div
            style={{
              background: '#1a2129',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            {notificationList.map((notif) => {
              const { bg, color, icon } = getNotificationIconDetails(notif.type)
              const isUnread = !notif.is_read
              const isHovered = hoveredId === notif.id

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationTap(notif)}
                  onMouseEnter={() => setHoveredId(notif.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    transition: 'background 150ms ease',
                    position: 'relative',
                    background: isUnread 
                      ? 'rgba(255,106,44,0.04)' 
                      : isHovered 
                        ? 'rgba(255,255,255,0.03)' 
                        : 'transparent',
                    borderLeft: isUnread ? '3px solid #ff6a2c' : '3px solid transparent',
                    paddingLeft: isUnread ? '17px' : '20px'
                  }}
                >
                  {/* Icon container */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: bg,
                      color: color
                    }}
                  >
                    {icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '14.5px', color: '#f3f1ea', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {notif.title}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#9ba6ad',
                        marginTop: '2px',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {notif.body}
                    </div>
                  </div>

                  {/* Time */}
                  <div style={{ fontSize: '12px', color: '#6b757c', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '2px' }}>
                    {getRelativeTime(notif.createdAt)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
export { Notifications }
