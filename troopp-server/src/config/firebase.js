import admin from 'firebase-admin'
import logger from './logger.js'

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY
} = process.env

let firebaseApp = null

if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
  try {
    const formattedPrivateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: formattedPrivateKey
      })
    })
    logger.info('Firebase Admin initialized successfully.')
  } catch (error) {
    logger.error('Firebase Admin initialization error:', error)
  }
} else {
  logger.warn('Firebase configuration variables are missing. FCM notification services will operate in mock logs mode.')
}

export default firebaseApp
export { admin }
