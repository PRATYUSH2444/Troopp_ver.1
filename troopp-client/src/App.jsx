import React, { useState, useEffect } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import AppRouter from './routes/AppRouter.jsx'
import useOnlineStatus from './hooks/useOnlineStatus.js'
import InstallPromptBanner from './components/ui/InstallPromptBanner.jsx'

/**
 * Offline & Install Promoter component managing banner indicators and install captures.
 */
const OfflineAndInstallManager = () => {
  const isOnline = useOnlineStatus()
  const location = useLocation()
  
  // Promotion trigger criteria states
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [pagesVisited, setPagesVisited] = useState(0)
  const [elapsed, setElapsed] = useState(false)

  // 1. Listen for browser App install prompts
  useEffect(() => {
    const handleInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
  }, [])

  // 2. Track incremental page transitions (requires >= 3)
  useEffect(() => {
    const visits = parseInt(sessionStorage.getItem('pwa_pages_visited') || '0', 10) + 1
    sessionStorage.setItem('pwa_pages_visited', visits.toString())
    setPagesVisited(visits)
  }, [location.pathname])

  // 3. Track active session time (requires >= 2 minutes)
  useEffect(() => {
    const sessionStart = parseInt(sessionStorage.getItem('pwa_session_start') || '0', 10)
    let startVal = sessionStart
    if (!sessionStart) {
      startVal = Date.now()
      sessionStorage.setItem('pwa_session_start', startVal.toString())
    }

    const checkTime = () => {
      if (Date.now() - startVal >= 2 * 60 * 1000) {
        setElapsed(true)
      }
    }

    checkTime()
    const timer = setInterval(checkTime, 10000)
    return () => clearInterval(timer)
  }, [])

  // 4. Verify triggers rules
  useEffect(() => {
    if (!deferredPrompt || !elapsed || pagesVisited < 3) {
      setShowInstallBanner(false)
      return
    }

    const dismissedTime = localStorage.getItem('pwa_install_dismissed')
    if (dismissedTime) {
      const elapsedSinceDismiss = Date.now() - parseInt(dismissedTime, 10)
      if (elapsedSinceDismiss < 7 * 24 * 60 * 60 * 1000) { // 7 days throttle
        setShowInstallBanner(false)
        return
      }
    }

    setShowInstallBanner(true)
  }, [deferredPrompt, elapsed, pagesVisited])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstallBanner(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', Date.now().toString())
    setShowInstallBanner(false)
  }

  return (
    <>
      {/* Persistent Yellow Offline Warning Banner */}
      {!isOnline && (
        <div className="bg-amber-400 text-amber-950 text-xs font-black text-center py-2 px-4 sticky top-0 left-0 right-0 z-[99999] flex justify-center items-center gap-1.5 shadow-md">
          <span>⚠️</span>
          <span>You are currently offline. Some features and layouts may be unavailable.</span>
        </div>
      )}

      {/* Add to Home Screen Promotion Panel */}
      <InstallPromptBanner
        show={showInstallBanner}
        onInstall={handleInstallClick}
        onDismiss={handleDismiss}
      />
    </>
  )
}

/**
 * Root React App wrapper mounting Auth Context and Route map.
 */
function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <NotificationProvider>
          <OfflineAndInstallManager />
          <AppRouter />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
