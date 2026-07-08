import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { haptics } from '../../utils/haptics.js'
import { playSuccess, playError } from '../../utils/sounds.js'

/**
 * @typedef {Object} OTPInputProps
 * @property {(otp: string) => void} onComplete - Callback executed once all boxes are filled
 * @property {number} [length] - Number of digit fields (default 6)
 * @property {boolean} [disabled] - Disables interaction across all fields
 * @property {boolean} [hasError] - Triggers shake and clearance animations
 */

/**
 * Troopp Common Secure OTP Numeric Input row.
 * @param {OTPInputProps} props
 */
const OTPInput = ({ onComplete, length = 6, disabled = false, hasError = false }) => {
  const [values, setValues] = useState(Array(length).fill(''))
  const [isError, setIsError] = useState(hasError)
  const [isSuccess, setIsSuccess] = useState(false)
  const inputRefs = useRef([])

  // Track error state and auto-clear with animation
  useEffect(() => {
    if (hasError) {
      setIsError(true)
      playError()
      const timer = setTimeout(() => {
        setIsError(false)
        setValues(Array(length).fill(''))
        inputRefs.current[0]?.focus()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [hasError, length])

  // Reset focus when cleared
  useEffect(() => {
    if (values.every(val => val === '')) {
      inputRefs.current[0]?.focus()
    }
    const combinedOTP = values.join('')
    if (combinedOTP.length === length) {
      setIsSuccess(true)
    } else {
      setIsSuccess(false)
    }
  }, [values, length])

  const handleChange = (e, index) => {
    const val = e.target.value
    if (val && !/^\d+$/.test(val)) return

    const newValues = [...values]
    newValues[index] = val.slice(-1)
    setValues(newValues)

    const combinedOTP = newValues.join('')
    if (combinedOTP.length === length) {
      haptics.success()
      playSuccess()
      onComplete(combinedOTP)
    }

    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!values[index] && index > 0) {
        const newValues = [...values]
        newValues[index - 1] = ''
        setValues(newValues)
        inputRefs.current[index - 1]?.focus()
      } else {
        const newValues = [...values]
        newValues[index] = ''
        setValues(newValues)
      }
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    if (disabled) return
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pastedData.length === 0) return

    // Staggered fill cascade (50ms interval per digit)
    pastedData.split('').forEach((char, idx) => {
      setTimeout(() => {
        setValues((prev) => {
          const next = [...prev]
          next[idx] = char
          return next
        })
        if (idx === pastedData.length - 1) {
          const finalOTP = pastedData.slice(0, length)
          if (finalOTP.length === length) {
            playSuccess()
            onComplete(finalOTP)
          }
        }
      }, idx * 50)
    })

    const focusIndex = Math.min(pastedData.length - 1, length - 1)
    setTimeout(() => {
      inputRefs.current[focusIndex]?.focus()
    }, pastedData.length * 50)
  }

  return (
    <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
      {Array(length)
        .fill(null)
        .map((_, index) => {
          return (
            <motion.div
              key={index}
              animate={
                isError
                  ? { x: [0, 8, -8, 4, -4, 0] }
                  : isSuccess
                  ? { y: [0, -10, 0] }
                  : {}
              }
              transition={
                isSuccess
                  ? { delay: index * 0.04, type: 'spring', stiffness: 300, damping: 10 }
                  : { duration: 0.4 }
              }
              className="relative w-11 h-12"
            >
              <input
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={values[index]}
                disabled={disabled}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={clsx(
                  'absolute inset-0 text-center text-lg font-bold font-mono bg-surface border rounded-xl outline-none select-none transition-all caret-primary text-transparent',
                  'focus:border-primary focus:ring-0 focus:shadow-neumorphic-primary-inset neumorphic-outset',
                  isSuccess ? 'border-emerald-500' : isError ? 'border-status-danger' : 'border-stone-200',
                  disabled && 'opacity-50 cursor-not-allowed bg-border/20 text-text-disabled'
                )}
                aria-label={`Digit ${index + 1} of ${length}`}
              />
              {/* Animated Digit Drop-in */}
              <AnimatePresence>
                {values[index] && (
                  <motion.div
                    initial={{ y: -12, opacity: 0, scale: 0.6 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                    className={clsx(
                      'absolute inset-0 flex items-center justify-center text-lg font-black font-mono pointer-events-none select-none',
                      isSuccess ? 'text-emerald-600' : isError ? 'text-status-danger' : 'text-text-primary'
                    )}
                  >
                    {values[index]}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
    </div>
  )
}

export default OTPInput
export { OTPInput }
