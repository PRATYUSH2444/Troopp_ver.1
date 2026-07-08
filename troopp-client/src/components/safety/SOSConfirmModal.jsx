import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * Double-gated safety SOS confirmation overlay.
 * Steps down 5 seconds before authorizing transmission.
 */
const SOSConfirmModal = ({ isOpen, onClose, onConfirm, contactName = 'Emergency Contacts' }) => {
  const [step, setStep] = useState(1) // 1: Initial alert check, 2: 5-second countdown lock
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setCountdown(5)
    }
  }, [isOpen])

  useEffect(() => {
    let timer
    if (step === 2 && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [step, countdown])

  if (!isOpen) return null

  const handleAlertNow = () => {
    setStep(2)
  }

  const handleFinalConfirm = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onConfirm({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Geolocation failed, triggering with default coordinates.', error)
          onConfirm({ latitude: 19.076, longitude: 72.877 }) // Mumbai fallback
        }
      )
    } else {
      onConfirm({ latitude: 19.076, longitude: 72.877 })
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,16,19,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          width: '100%',
          maxWidth: '360px',
          background: '#1a2129',
          border: '1px solid rgba(255,84,112,0.25)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          textAlign: 'center'
        }}
      >
        {step === 1 ? (
          <>
            <span style={{ fontSize: '40px', display: 'block' }} className="animate-bounce">🚨</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ff5470', fontFamily: 'var(--font-display)' }}>Trigger Emergency Alert?</h3>
              <p style={{ fontSize: '12px', color: '#9ba6ad', lineHeight: 1.4 }}>
                This will prepare an emergency SOS message routing your location coordinates to your contact: <strong style={{ color: '#f3f1ea' }}>{contactName}</strong>.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  height: '40px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: '#212b33',
                  borderRadius: '100px',
                  color: '#9ba6ad',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAlertNow}
                style={{
                  flex: 1,
                  height: '40px',
                  border: 'none',
                  background: 'rgba(255,84,112,0.14)',
                  color: '#ff5470',
                  borderRadius: '100px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Prepare Alert
              </button>
            </div>
          </>
        ) : (
          <>
            <span style={{ fontSize: '40px', display: 'block', color: '#ff5470', fontWeight: '800' }}>{countdown > 0 ? countdown : '⚠️'}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ff5470', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)' }}>Confirm Transmission</h3>
              <p style={{ fontSize: '11px', color: '#9ba6ad', lineHeight: 1.4 }}>
                This will send an immediate SMS and push notification alerts with your coordinate map.
              </p>
              <div style={{ background: 'rgba(255,84,112,0.08)', border: '1px solid rgba(255,84,112,0.15)', padding: '10px', borderRadius: '12px', fontSize: '10px', color: '#ff5470', lineHeight: 1.4 }}>
                🚨 This action alerts all emergency contacts and system administrators.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <button
                disabled={countdown > 0}
                onClick={handleFinalConfirm}
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '100px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                  background: countdown > 0 ? '#212b33' : 'linear-gradient(135deg, #ff5470 0%, #d92b47 100%)',
                  color: countdown > 0 ? '#6b757c' : 'white',
                  boxShadow: countdown === 0 ? '0 4px 14px rgba(255,84,112,0.3)' : 'none'
                }}
                className={countdown === 0 ? 'animate-pulse' : ''}
              >
                {countdown > 0 ? `Hold to Unlock (${countdown}s)` : 'Yes, Alert Now!'}
              </button>
              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  height: '36px',
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#9ba6ad',
                  cursor: 'pointer'
                }}
              >
                Dismiss SOS Alert
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default SOSConfirmModal
export { SOSConfirmModal }
