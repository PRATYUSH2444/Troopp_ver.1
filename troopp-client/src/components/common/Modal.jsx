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

  const sizeWidths = {
    sm: '440px',
    md: '540px',
    lg: '680px'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          {/* Dark Glass Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(12, 16, 19, 0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          />

          {/* Centered Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.35 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: sizeWidths[size],
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              borderRadius: '24px',
              boxShadow: 'var(--shadow-xl)',
              padding: '28px',
              maxHeight: '85vh',
              overflowY: 'auto',
              zIndex: 310,
              textAlign: 'left'
            }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              {title && <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0 }}>{title}</h3>}
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all var(--transition-fast) ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-raised)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
                aria-label="Close dialog"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{children}</div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>{description}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button 
            variant="ghost" 
            onClick={onClose}
            style={{
              padding: '8px 18px',
              height: '36px',
              borderRadius: '10px',
              border: '1.5px solid var(--border)',
              color: 'var(--text-secondary)',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '12.5px'
            }}
          >
            {cancelText}
          </Button>
          <Button 
            variant={isDanger ? 'danger' : 'primary'} 
            onClick={onConfirm}
            style={{
              padding: '8px 20px',
              height: '36px',
              borderRadius: '10px',
              border: 'none',
              color: '#ffffff',
              background: isDanger ? 'var(--danger)' : 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12.5px',
              boxShadow: isDanger ? 'none' : '0 4px 10px rgba(255,106,44,0.25)'
            }}
          >
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>{description}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button 
            variant="primary" 
            onClick={onClose}
            style={{
              padding: '8px 24px',
              height: '36px',
              borderRadius: '10px',
              border: 'none',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '12.5px',
              boxShadow: '0 4px 10px rgba(255,106,44,0.25)'
            }}
          >
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
