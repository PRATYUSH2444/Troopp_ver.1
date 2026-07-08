import React from 'react'
import { motion } from 'framer-motion'

/**
 * Premium step indicator for the 5-step registration funnel.
 * Features custom Framer Motion progress lines, active scale/pulsating glows,
 * and animated checkmarks. Inherits the dark Troopp visual language.
 */
export const SignupStepIndicator = ({ currentStep = 1 }) => {
  const steps = [1, 2, 3, 4, 5]
  const totalSteps = steps.length
  
  // Percentage calculation for the connector bar fill
  const fillPercent = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <div className="flex flex-col items-center w-full relative select-none">
      <div 
        className="relative flex items-center justify-between w-full max-w-[280px] mx-auto h-8"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Background connector line */}
        <div 
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '3px',
            background: 'rgba(255, 255, 255, 0.08)',
            top: '50%',
            transform: 'translateY(-50%)',
            borderRadius: '10px'
          }} 
        />
        
        {/* Animated fill line */}
        <motion.div 
          style={{
            position: 'absolute',
            left: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #ff6a2c, #d9481a)',
            top: '50%',
            transform: 'translateY(-50%)',
            borderRadius: '10px',
            boxShadow: '0 0 8px rgba(255, 106, 44, 0.35)'
          }}
          initial={{ width: 0 }}
          animate={{ width: `${fillPercent}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />

        {/* Step circles */}
        {steps.map((s, index) => {
          const isCompleted = s < currentStep
          const isActive = s === currentStep
          const status = isCompleted ? 'complete' : isActive ? 'active' : 'inactive'

          return (
            <div 
              key={s} 
              className="relative z-10 flex items-center justify-center"
              style={{ width: '28px', height: '28px' }}
            >
              {status === 'complete' ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff6a2c, #d9481a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(255, 106, 44, 0.25)'
                  }}
                >
                  <CheckIcon style={{ width: '12px', height: '12px', color: 'white' }} />
                </motion.div>
              ) : status === 'active' ? (
                <motion.div 
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(255, 106, 44, 0.5), 0 4px 10px rgba(255, 106, 44, 0.3)',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '900',
                    fontFamily: 'Space Grotesk, sans-serif'
                  }}
                >
                  {s}
                </motion.div>
              ) : (
                <div 
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#212b33',
                    border: '1.5px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b757c',
                    fontSize: '11px',
                    fontWeight: '700',
                    fontFamily: 'Space Grotesk, sans-serif'
                  }}
                >
                  {s}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CheckIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.05, type: 'tween', ease: 'easeOut', duration: 0.3 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}

export default SignupStepIndicator
