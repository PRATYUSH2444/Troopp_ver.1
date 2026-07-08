import { useState, useEffect } from 'react'

/**
 * Custom hook listening for PWA registration install triggers ('beforeinstallprompt').
 * Exposes capability to trigger custom in-app install banner flows.
 */
export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const triggerInstall = async () => {
    if (!deferredPrompt) return false
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return outcome === 'accepted'
  }

  return { isInstallable: !!deferredPrompt, triggerInstall }
}

export default useInstallPrompt
