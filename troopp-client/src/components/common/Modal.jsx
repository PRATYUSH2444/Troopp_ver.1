import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import Button from './Button.jsx'

/**
 * @typedef {Object} ModalProps
 * @property {boolean} isOpen - Controls modal visibility state
 * @property {() => void} onClose - Modal close callback
 * @property {React.ReactNode} children - Modal body contents
 * @property {string} [title] - Title text in header
 * @property {'sm' | 'md' | 'lg'} [size] - Desktop width limits
 */

/**
 * Troopp Common Base Modal (Glass overlay + scale-in content card)
 * @param {ModalProps} props
 */
export const BaseModal = ({ isOpen, onClose, children, title, size = 'md' }) => {
  // Prevent page scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Dark Glass Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
          />

          {/* Centered Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.35 }}
            className={clsx(
              'relative w-full glass-card p-6 bg-surface/90 border border-border shadow-xl focus:outline-none overflow-y-auto max-h-[85vh]',
              sizeClasses[size]
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              {title && <h3 className="text-lg font-heading font-bold text-text-primary">{title}</h3>}
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary p-1.5 hover:bg-border/30 rounded-lg transition-all"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="text-sm text-text-secondary leading-relaxed">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/**
 * Confirm Prompt Modal.
 */
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{description}</p>
        <div className="flex gap-2.5 justify-end">
          <Button variant="ghost" onClick={onClose} size="sm">
            {cancelText}
          </Button>
          <Button variant={isDanger ? 'danger' : 'primary'} onClick={onConfirm} size="sm">
            {confirmText}
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}

/**
 * Alert Modal.
 */
export const AlertModal = ({ isOpen, onClose, title, description, buttonText = 'Acknowledge' }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{description}</p>
        <div className="flex justify-end">
          <Button variant="primary" onClick={onClose} size="sm">
            {buttonText}
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}

/**
 * Immersive FullScreen / Right Drawer Modal.
 */
export const FullScreenModal = ({ isOpen, onClose, children, title }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex justify-end">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm"
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="relative w-full md:max-w-md h-full bg-bg border-l border-border shadow-2xl flex flex-col focus:outline-none"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-border bg-surface">
              <h3 className="text-base font-heading font-bold text-text-primary">{title}</h3>
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary p-2 hover:bg-border/30 rounded-lg"
                aria-label="Close panel"
              >
                ✕
              </button>
            </div>

            {/* Contents */}
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default BaseModal
