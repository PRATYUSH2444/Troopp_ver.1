import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInstallPrompt } from '../../hooks/useInstallPrompt.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

/**
 * Dismissible, persistent overlay banner promoting travelers to install the PWA.
 * Can be controlled (via custom engagement logic in App.jsx) or standalone.
 */
export const InstallPromptBanner = ({ show, onInstall, onDismiss }) => {
  const { isInstallable, triggerInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)
  const reduced = useReducedMotion()

  const isVisible = show !== undefined ? show : (isInstallable && !dismissed)

  if (!isVisible) return null

  const handleInstallClick = async () => {
    if (onInstall) {
      onInstall()
    } else {
      const accepted = await triggerInstall()
      if (accepted) {
        setDismissed(true)
      }
    }
  }

  const handleDismissClick = () => {
    if (onDismiss) {
      onDismiss()
    } else {
      setDismissed(true)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.3 }}
        className="fixed bottom-20 left-4 right-4 max-w-md mx-auto bg-stone-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 z-40 flex items-center justify-between gap-3 select-none"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white leading-tight">Install Troopp</span>
            <span className="text-[10px] text-stone-400">Add to your home screen for offline capability</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDismissClick}
            className="px-2.5 py-1.5 border border-stone-850 hover:bg-stone-800 rounded-xl text-[10px] font-bold text-stone-300 cursor-pointer"
          >
            Later
          </button>
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-[10px] font-extrabold shadow cursor-pointer"
          >
            Install
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default InstallPromptBanner
