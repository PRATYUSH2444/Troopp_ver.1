// Import Firebase App and Messaging Compat SDKs from CDN
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Initialize mock configuration (this matches our Firebase Project ID or falls back safely)
firebase.initializeApp({
  apiKey: "mock-api-key",
  authDomain: "troopp-fcm.firebaseapp.com",
  projectId: "troopp-fcm",
  storageBucket: "troopp-fcm.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
})

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[FIREBASE SW] Received background message: ', payload)

  const notificationTitle = payload.notification?.title || 'Troopp Update'
  const notificationOptions = {
    body: payload.notification?.body || 'New update from your group!',
    icon: '/logo192.png',
    badge: '/badge.png',
    data: {
      deepLink: payload.data?.deepLink || '/feed'
    }
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Listen to notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const targetUrl = event.notification.data?.deepLink || '/feed'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then((focusedClient) => focusedClient.navigate(targetUrl))
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
