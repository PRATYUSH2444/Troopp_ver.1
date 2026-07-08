import React, { useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { ConfirmModal } from './Modal.jsx'

/**
 * @typedef {Object} SOSButtonProps
 * @property {() => void} onTrigger - Callback executed once SOS confirm is validated
 * @property {boolean} [hasEmergencyContact] - Verification parameter to block triggers if details are missing
 * @property {string} [className] - Custom class placements
 */

/**
 * Troopp Common Safety SOS Trigger Floating Button.
 * @param {SOSButtonProps} props
 */
const SOSButton = ({ onTrigger, hasEmergencyContact = true, className }) => {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSOSClick = () => {
    setShowConfirm(true)
  }

  const handleConfirmSOS = () => {
    setShowConfirm(false)
    onTrigger()
  }

  return (
    <>
      <div className={clsx('fixed bottom-6 right-6 z-[9999] select-none', className)}>
        {/* Floating Pulsing Button */}
        <motion.button
          onClick={handleSOSClick}
          animate={hasEmergencyContact ? {
            scale: [1.0, 1.04, 1.0],
          } : {}}
          transition={hasEmergencyContact ? {
            scale: {
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut"
            },
            type: 'spring',
            stiffness: 400,
            damping: 15
          } : {}}
          whileHover={hasEmergencyContact ? {
            scale: 1.08,
            boxShadow: '0 0 20px 6px rgba(220, 38, 38, 0.7)'
          } : {}}
          whileTap={hasEmergencyContact ? {
            scale: 0.9,
            transition: { duration: 0.1 }
          } : {}}
          className={clsx(
            'w-14 h-14 rounded-full bg-status-danger text-white font-heading font-bold text-sm flex items-center justify-center shadow-lg border border-red-500/30 focus:outline-none',
            !hasEmergencyContact && 'opacity-60 cursor-not-allowed'
          )}
          title={hasEmergencyContact ? 'Trigger SOS Emergency' : 'Set up emergency contacts in Profile to activate SOS'}
        >
          SOS
        </motion.button>
      </div>

      {/* Two-step confirm verification prompt */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSOS}
        title="⚠️ ACTIVATE EMERGENCY SOS?"
        description={
          hasEmergencyContact
            ? "This will immediately send distress SMS messages containing your current GPS coordinates to your registered emergency contacts and alert Troopp administrators. Do you want to proceed?"
            : "You must set up emergency contact details in your profile settings before you can trigger distress alerts. Do you want to set them up now?"
        }
        confirmText={hasEmergencyContact ? "YES, TRIGGER SOS" : "Acknowledge"}
        isDanger={true}
      />
    </>
  )
}

export default SOSButton
export { SOSButton }
