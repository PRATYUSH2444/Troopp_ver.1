import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'

// Mock config matching environment keys or fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "troopp-fcm.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "troopp-fcm",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "troopp-fcm.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
}

// Initialize firebase client app instance
let app = null
let messaging = null

try {
  app = initializeApp(firebaseConfig)
  messaging = getMessaging(app)
  console.log('[FIREBASE CLIENT] Successfully initialized.')
} catch (error) {
  console.warn('[FIREBASE CLIENT] Failed to initialize Firebase App. Operating in mock mode.', error)
}

export { app, messaging }
export default messaging
