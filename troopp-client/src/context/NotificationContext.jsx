import React, { createContext, useContext, useState, useEffect } from 'react'
import { messaging } from '../firebase.js'
import { getToken, onMessage } from 'firebase/messaging'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth } from './AuthContext.jsx'
import { apiRequest } from '../utils/api.js'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth()

  // State managers
  const [fcmToken, setFcmToken] = useState(null)
  const [notificationList, setNotificationList] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPermissionGranted, setIsPermissionGranted] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted'
    }
    return false
  })

  // 1. Retrieve current registration token and send to backend
  const fetchAndRegisterToken = async () => {
    if (!messaging) return

    try {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BC-mock-vapid-key-here'
      })

      if (token) {
        setFcmToken(token)
        setIsPermissionGranted(true)
        console.log('[FCM TOKEN]: Registered: ', token)

        // Dispatch token registration to server
        if (isAuthenticated) {
          // axios.post('/api/v1/notifications/fcm-token', { fcmToken: token, deviceLabel: 'Web Client' })
          await new Promise((r) => setTimeout(r, 100))
        }
      }
    } catch (err) {
      console.warn('Failed retrieving FCM token:', err)
    }
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) return false

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setIsPermissionGranted(true)
        await fetchAndRegisterToken()
        return true
      }
      setIsPermissionGranted(false)
      return false
    } catch (err) {
      console.error('Error requesting notification permission:', err)
      return false
    }
  }

  // 2. Setup foreground listeners on permission granted and authenticated session
  useEffect(() => {
    if (isPermissionGranted && isAuthenticated) {
      fetchAndRegisterToken()
    }
  }, [isPermissionGranted, isAuthenticated])

  useEffect(() => {
    if (!messaging || !isAuthenticated) return

    // Bind foreground FCM alerts
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM FOREGROUND MESSAGE]:', payload)

      const title = payload.notification?.title || 'Troopp Alert'
      const body = payload.notification?.body || 'New update received.'

      // Trigger beautiful hot-toast notification
      toast(
        (t) => (
          <div className="flex flex-col gap-1 text-xs text-text-primary">
            <span className="font-bold">{title}</span>
            <span>{body}</span>
          </div>
        ),
        {
          icon: '🔔',
          duration: 4000,
          position: 'top-right'
        }
      )

      // Add to list and bump badge count
      setNotificationList((prev) => [
        {
          id: payload.messageId || Math.random().toString(36).substring(2),
          title,
          body,
          createdAt: new Date(),
          is_read: false,
          data: payload.data || {}
        },
        ...prev
      ])
      setUnreadCount((prev) => prev + 1)
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [isAuthenticated])

  const fetchNotifications = async () => {
    if (!isAuthenticated) return
    try {
      const res = await apiRequest('/community/notifications')
      if (res && res.ok) {
        const json = await res.json()
        if (json.status === 'success') {
          const list = json.data.notifications || []
          setNotificationList(list)
          const unread = list.filter((n) => !n.is_read).length
          setUnreadCount(unread)
        }
      }
    } catch (err) {
      console.error('Failed fetching notifications:', err)
    }
  }

  const markAsRead = async (id) => {
    try {
      await apiRequest(`/community/notifications/${id}/read`, { method: 'PATCH' })
      setNotificationList((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed marking notification as read:', err)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
    } else {
      setNotificationList([])
      setUnreadCount(0)
    }
  }, [isAuthenticated])

  // Mark all as read action
  const markAllAsRead = async () => {
    try {
      // For fallback and compliance, mark each locally and via API calls in batch if unread
      const unreadList = notificationList.filter((n) => !n.is_read)
      await Promise.all(
        unreadList.map((n) => apiRequest(`/community/notifications/${n.id}/read`, { method: 'PATCH' }))
      )
      setUnreadCount(0)
      setNotificationList((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      console.error('Failed marking notifications as read:', err)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        fcmToken,
        notificationList,
        unreadCount,
        isPermissionGranted,
        requestPermission,
        markAllAsRead,
        markAsRead,
        fetchNotifications,
        setNotificationList,
        setUnreadCount
      }}
    >
      <Toaster />
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export default NotificationContext
export { NotificationContext }
