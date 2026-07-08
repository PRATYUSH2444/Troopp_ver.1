import React, { createContext, useContext, useState, useEffect } from 'react'
import { messaging } from '../firebase.js'
import { getToken, onMessage } from 'firebase/messaging'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth } from './AuthContext.jsx'

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

  // Mark all as read action
  const markAllAsRead = async () => {
    try {
      // Dispatch: axios.put('/api/v1/notifications/read-all')
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
