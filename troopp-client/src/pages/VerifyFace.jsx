import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import confetti from 'canvas-confetti'
import { useAuth } from '../context/AuthContext.jsx'
import { haptics } from '../utils/haptics.js'
import { playSuccess, playError } from '../utils/sounds.js'

// Precise start -> end NumberTicker widget
const NumberTicker = ({ startValue = 0, value, duration = 1200 }) => {
  const [displayValue, setDisplayValue] = useState(startValue)
  
  useEffect(() => {
    let start = startValue
    const end = value
    if (start === end) return
    
    const startTime = performance.now()
    let frameId
    
    const update = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = progress * (2 - progress) // Ease out quad
      const current = Math.round(start + (end - start) * easeProgress)
      setDisplayValue(current)
      
      if (progress < 1) {
        frameId = requestAnimationFrame(update)
      } else {
        setDisplayValue(end)
      }
    }
    
    frameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frameId)
  }, [value, startValue, duration])
  
  return <span>{displayValue}</span>
}

const VerifyFace = () => {
  const [file, setFile] = useState(null)
  const [comparing, setComparing] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        return toast.error('Selfie size must be under 5MB.')
      }
      setFile(selected)
    }
  }

  // Trigger Saffron orange & Forest green confetti
  const triggerVerificationConfetti = () => {
    const colors = ['#FF9933', '#137333', '#FFCC00', '#0F9D58']
    confetti({
      particleCount: 120,
      spread: 85,
      origin: { y: 0.4 },
      colors: colors
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      return toast.error('Please upload a selfie photo to perform face comparison.')
    }

    const formData = new FormData()
    formData.append('selfie', file)

    setComparing(true)
    try {
      const { getAccessToken, BASE_URL } = await import('../utils/api.js')
      const accessToken = getAccessToken()

      const res = await fetch(`${BASE_URL}/kyc/compare-face`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Face comparison failed.')
      }

      const result = data.data
      if (result.status === 'verified') {
        setUser((prev) => ({ ...prev, faceVerified: true, idVerified: true }))
        setShowCelebration(true)
        haptics.success()
        playSuccess()
        triggerVerificationConfetti()
      } else {
        toast.warn(result.message || 'Verification submitted for manual review.')
        playError()
        navigate('/profile/me')
      }
    } catch (err) {
      playError()
      toast.error(err.message || 'Comparison failed. Position your face clearly.')
    } finally {
      setComparing(false)
    }
  }

  return (
    <div className="w-full py-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col gap-6 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {!showCelebration ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              <div className="text-center flex flex-col gap-1.5">
                <h2 className="font-heading font-black text-2xl text-white tracking-tight">
                  Selfie Verification
                </h2>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Step 2 of 2: Match face selfie against ID document
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                  <span className="text-sm font-semibold text-stone-300">Selfie Checklist</span>
                  <ul className="text-[10px] text-stone-400 font-bold uppercase tracking-wider text-left flex flex-col gap-1.5 px-2 mt-1">
                    <li>🟢 Good lighting (no dark shadows)</li>
                    <li>🟢 Look straight ahead, remove hats/glasses</li>
                    <li>🟢 Make sure your face fits inside the camera frames</li>
                  </ul>
                </div>

                {/* Upload input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">
                    Select Selfie Photo (PNG, JPG - Max 5MB)
                  </label>
                  <div className="border-2 border-dashed border-white/10 hover:border-primary/30 rounded-2xl p-6 text-center cursor-pointer relative bg-white/5 flex flex-col items-center gap-2">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <span className="text-3xl">📸</span>
                    <span className="text-xs font-bold text-white">
                      {file ? file.name : 'Select or capture selfie here'}
                    </span>
                    <span className="text-[9px] text-stone-400 font-bold uppercase">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Click to trigger camera'}
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/profile/me')}
                    className="flex-1 h-11 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={comparing}
                    className="flex-1 h-11 bg-stone-900 border border-white/5 text-white hover:bg-stone-850 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {comparing ? 'Matching Face...' : 'Compare Face'}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="celebration"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center text-center py-4 gap-5"
            >
              {/* Self-drawing green checkmark */}
              <div className="w-16 h-16 bg-success-bg rounded-full flex items-center justify-center border border-success/10 shadow-inner">
                <svg
                  className="w-8 h-8 stroke-success stroke-[3.5] fill-none"
                  viewBox="0 0 24 24"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <div className="flex flex-col gap-1">
                <h2 className="font-heading font-black text-2xl text-white tracking-tight">
                  Verification Successful!
                </h2>
                <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-widest">
                  Identity matched and verified
                </span>
              </div>

              {/* Circular Trust Score Sweep (35 -> 65) */}
              <div className="relative w-32 h-32 flex items-center justify-center my-2">
                <svg className="w-full h-full transform -rotate-90 animate-[spinSpeed_12s_linear_infinite]" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-stone-800"
                    strokeWidth="8"
                    fill="none"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-success"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="251.2"
                    initial={{ strokeDashoffset: 251.2 - (251.2 * 35) / 100 }}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * 65) / 100 }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">
                    <NumberTicker startValue={35} value={65} duration={1200} />
                  </span>
                  <span className="text-[7px] font-black uppercase text-stone-450 tracking-widest mt-0.5">Trust Score</span>
                </div>
                
                {/* Floating +30 text particle rising and fading */}
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -50, scale: [0.5, 1.2, 1.2, 0.8] }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.4 }}
                  className="absolute text-success font-extrabold text-[10px] bg-success-bg border border-success/15 px-2 py-0.5 rounded-full shadow-sm z-30"
                >
                  +30 SCORE
                </motion.div>
              </div>

              {/* Badge Upgrade Morphing Animation */}
              <div className="flex items-center justify-center gap-6 h-12 relative w-full mt-1">
                {/* Old Badge "New Explorer" shrinking and fading */}
                <motion.div
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.8, ease: 'easeInOut' }}
                  className="absolute px-3 py-1 bg-amber-500 text-white rounded-full text-[9px] font-bold shadow-md uppercase tracking-wider"
                >
                  👶 New Explorer
                </motion.div>
                
                {/* New Badge "Verified Member" growing and appearing */}
                <motion.div
                  initial={{ scale: 0, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 15, delay: 1.3 }}
                  className="absolute px-3.5 py-1 bg-emerald-600 text-white rounded-full text-[9px] font-bold shadow-md uppercase tracking-widest flex items-center gap-1 border border-emerald-500"
                >
                  <span>🛡️ Verified Member</span>
                  <motion.span
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-[9px]"
                  >
                    ✨
                  </motion.span>
                </motion.div>
              </div>

              {/* Done button to return */}
              <button
                onClick={() => navigate('/profile/me')}
                className="mt-4 w-full h-11 bg-stone-900 border border-white/5 text-white hover:bg-stone-850 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Go to Profile
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default VerifyFace
