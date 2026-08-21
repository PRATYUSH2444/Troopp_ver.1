import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
import './styles/variables.css'
import './styles/globals.css'
import './styles/animations.css'
import './styles/glass.css'
import './styles/neumorphic.css'

// Initialize Sentry client-side if DSN is defined
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn && sentryDsn !== 'https://your_sentry_dsn_key@o0.ingest.sentry.io/0') {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  })
}

// Automatically recover from stale deployment chunks without falling into ErrorBoundary
const handleChunkError = () => {
  const hasReloaded = sessionStorage.getItem('chunk_preload_reload')
  if (!hasReloaded) {
    sessionStorage.setItem('chunk_preload_reload', 'true')
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) reg.unregister()
        window.location.reload()
      })
    } else {
      window.location.reload()
    }
  }
}

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  handleChunkError()
})

window.addEventListener('unhandledrejection', (event) => {
  const isChunkError =
    /Failed to fetch dynamically imported module/i.test(event.reason?.message || '') ||
    /Loading chunk/i.test(event.reason?.message || '') ||
    /error loading dynamically imported module/i.test(event.reason?.message || '')

  if (isChunkError) {
    event.preventDefault()
    handleChunkError()
  }
})

// Clean up registered service workers in development mode to avoid HMR caching freeze
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((unregistered) => {
        if (unregistered) {
          console.log('[Dev SW Cleanup] Unregistered stale service worker:', registration)
          window.location.reload()
        }
      })
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg text-text-primary px-4">
          <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-primary text-white text-2xl font-bold shadow-neumorphic-outset">
            T
          </div>
          <h1 className="text-2xl font-heading font-bold mb-2">Something went wrong</h1>
          <p className="text-text-secondary text-sm mb-6 text-center max-w-xs">
            We encountered an unexpected error. Please try reloading the page.
          </p>
          <button
            onClick={() => {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  for (const reg of registrations) reg.unregister()
                  window.location.reload()
                })
              } else {
                window.location.reload()
              }
            }}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-neumorphic-outset transition-all active:shadow-neumorphic-inset"
          >
            Refresh App
          </button>
        </div>
      }
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
)
