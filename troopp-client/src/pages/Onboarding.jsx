import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import confetti from 'canvas-confetti'
import { apiRequest } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'

// NumberTicker component for starting trust score display
const NumberTicker = ({ value, duration = 400 }) => {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValueRef = useRef(0)
  
  useEffect(() => {
    let start = prevValueRef.current
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
        prevValueRef.current = end
      }
    }
    
    frameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frameId)
  }, [value, duration])

  useEffect(() => {
    prevValueRef.current = value
  }, [value])
  
  return <span>{displayValue}</span>
}

// Gentle audio synthesizer for tag limit chime
const playSuccessChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
    
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch (e) {
    console.warn('AudioContext failed:', e)
  }
}

// Confetti triggers
const triggerConfettiBurst = () => {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.4 }
  })
}

const triggerConfettiRain = () => {
  const duration = 3.5 * 1000
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 }
    })
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 }
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }
  frame()
}

const AVAILABLE_TAGS = [
  'Trekking',
  'Camping',
  'Photography Walk',
  'Road Trips',
  'Night Drives',
  'Cycling',
  'Heritage Walks',
  'Day Trips'
]

const Onboarding = () => {
  const [step, setStep] = useState(1)
  const [cities, setCities] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuth()

  // Onboarding details
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState('prefer_not_to_say')
  const [cityId, setCityId] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  
  // Emergency contact details
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyRelation, setEmergencyRelation] = useState('')

  // KYC details
  const [docType, setDocType] = useState('aadhaar')
  const [idFile, setIdFile] = useState(null)
  const [selfieFile, setSelfieFile] = useState(null)

  // Onboarding completion calculations
  const calculateCompletion = () => {
    let score = 0
    if (bio.trim().length > 0) score += 25
    if (emergencyName.trim().length > 0 && emergencyPhone.length === 10 && emergencyRelation.trim().length > 0) score += 25
    if (idFile && selfieFile) score += 25
    if (selectedTags.length >= 3) score += 25
    return score
  }

  const completionPercent = calculateCompletion()
  const prevCompletionRef = useRef(0)

  useEffect(() => {
    const prev = prevCompletionRef.current
    const curr = completionPercent

    if (curr >= 50 && prev < 50) {
      triggerConfettiBurst()
    }
    if (curr === 100 && prev < 100) {
      triggerConfettiRain()
    }
    prevCompletionRef.current = curr
  }, [completionPercent])

  useEffect(() => {
    // Fetch active cities list
    const loadCities = async () => {
      try {
        const res = await apiRequest('/cities')
        if (res.ok) {
          const data = await res.json()
          setCities(data.data || [])
          if (data.data?.length > 0) {
            setCityId(data.data[0].id)
          }
        }
      } catch (err) {
        console.error('Failed loading cities list:', err)
      }
    }
    loadCities()
  }, [])

  const toggleTag = (tag) => {
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    setSelectedTags((prev) => {
      const nextTags = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
      if (nextTags.length === 3 && prev.length < 3) {
        playSuccessChime()
      }
      return nextTags
    })
  }

  const handleIdChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error('File size must be under 5MB.')
      setIdFile(file)
    }
  }

  const handleSelfieChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error('File size must be under 5MB.')
      setSelfieFile(file)
    }
  }

  const handleComplete = async () => {
    setSubmitting(true)
    try {
      const { getAccessToken, BASE_URL } = await import('../utils/api.js')
      const token = getAccessToken()

      // 1. Submit Profile details
      const profileRes = await apiRequest('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify({
          bio: bio.trim(),
          gender,
          interestTags: selectedTags
        })
      })
      if (!profileRes.ok) throw new Error('Failed to save profile configurations.')

      // 2. Submit Emergency contact if details filled
      if (emergencyName && emergencyPhone && emergencyRelation) {
        const cleaned = emergencyPhone.replace(/\D/g, '')
        if (cleaned.length === 10) {
          await apiRequest('/profiles/emergency-contacts', {
            method: 'POST',
            body: JSON.stringify({
              name: emergencyName.trim(),
              phone: `+91${cleaned}`,
              relationship: emergencyRelation.trim()
            })
          })
        }
      }

      // 3. Submit KYC uploads if present
      if (idFile && selfieFile) {
        const idData = new FormData()
        idData.append('document', idFile)
        idData.append('docType', docType)

        const idRes = await fetch(`${BASE_URL}/kyc/upload-id`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: idData
        })
        if (idRes.ok) {
          const selfieData = new FormData()
          selfieData.append('selfie', selfieFile)
          await fetch(`${BASE_URL}/kyc/compare-face`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: selfieData
          })
        }
      }

      // 4. Complete Onboarding flag update
      const completeRes = await apiRequest('/profiles/complete-onboarding', {
        method: 'POST'
      })

      if (completeRes.ok) {
        toast.success('Onboarding complete! Enjoy your journeys.')
        setUser((prev) => ({ ...prev, onboardingCompleted: true }))
        navigate('/feed')
      } else {
        throw new Error('Onboarding confirmation failed.')
      }

    } catch (err) {
      toast.error(err.message || 'Verification or save failed. Please review fields.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-8 shadow-2xl flex flex-col gap-6"
      >
        {/* Wizard header */}
        <div className="flex flex-col gap-3 bg-stone-50 border border-stone-150 p-4 rounded-2xl">
          <div className="flex justify-between items-center w-full">
            <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">
              Setup Wizard - Step {step} of 4
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-3 h-1.5 rounded-full transition-all ${
                    step === s ? 'bg-primary w-6' : 'bg-stone-200'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Liquid Completion Bar */}
          <div className="flex flex-col gap-1.5 mt-1 border-t border-stone-200/60 pt-2.5">
            <div className="flex justify-between items-center text-[9px] font-extrabold text-stone-500 uppercase tracking-wider">
              <span>Profile Completion</span>
              <span className="text-primary font-black">{completionPercent}%</span>
            </div>
            <div className="w-full h-3 bg-stone-200/50 rounded-full overflow-hidden relative border border-stone-150">
              <motion.div
                animate={{ width: `${completionPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full relative overflow-hidden"
              >
                {/* Wave shimmer effect */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[shimmer_1.5s_infinite_linear]" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Step 1: Bio */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-heading font-black text-2xl text-stone-900 tracking-tight">
              Tell us about yourself
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
                Tell us your tagline bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Day dreamer, trek lover, or weekend driver..."
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50 resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50 cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
                  Home City
                </label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50 cursor-pointer"
                >
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Emergency Contact */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-heading font-black text-2xl text-stone-900 tracking-tight">
              Emergency Contact Setup
            </h3>
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
              Safety measures: register someone we can alert in emergency situations
            </span>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
                Contact Full Name
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Ramesh Malhotra"
                className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
                  Relationship
                </label>
                <input
                  type="text"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  placeholder="Father / Friend"
                  className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full h-11 pl-12 pr-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold tracking-wider focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: KYC Uploader */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-heading font-black text-2xl text-stone-900 tracking-tight">
              Identity Verification
            </h3>
            <span className="text-[10px] text-stone-450 font-bold uppercase tracking-wider">
              Verify your ID card and camera selfie to secure trust score permissions (skip option below)
            </span>

            <div className="flex flex-col gap-3">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="aadhaar">Aadhaar Card (India)</option>
                <option value="pan">PAN Card (India)</option>
                <option value="passport">Passport</option>
              </select>

              {/* ID upload input */}
              <div className="border border-stone-200 rounded-xl p-3 bg-stone-50 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-605">
                  {idFile ? idFile.name : 'Upload Government ID document'}
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, application/pdf"
                  onChange={handleIdChange}
                  className="hidden"
                  id="id-file-onb"
                />
                <label
                  htmlFor="id-file-onb"
                  className="px-3.5 py-1.5 bg-stone-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Browse ID
                </label>
              </div>

              {/* Selfie upload input */}
              <div className="border border-stone-200 rounded-xl p-3 bg-stone-50 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-605">
                  {selfieFile ? selfieFile.name : 'Take or upload Face Selfie'}
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleSelfieChange}
                  className="hidden"
                  id="selfie-file-onb"
                />
                <label
                  htmlFor="selfie-file-onb"
                  className="px-3.5 py-1.5 bg-stone-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Browse Face
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Interests */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-black text-2xl text-stone-900 tracking-tight">
                Select Interest Vibe Tags
              </h3>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                Select at least 3 vibe tags to complete your profile
              </p>
            </div>

            <div className="flex flex-wrap gap-2 py-2">
              {AVAILABLE_TAGS.map((tag) => {
                const selected = selectedTags.includes(tag)
                return (
                  <motion.button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none ${
                      selected
                        ? 'bg-primary border-primary text-white shadow-sm'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {tag}
                  </motion.button>
                )
              })}
            </div>

            <AnimatePresence>
              {selectedTags.length >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-col gap-4 mt-2"
                >
                  <div className="text-center text-xs font-extrabold text-emerald-600 flex items-center justify-center gap-1.5">
                    <span>✨ Let's go! (Minimum 3 tags selected)</span>
                  </div>

                  {completionPercent === 100 && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center justify-center text-center p-5 border border-emerald-100 bg-emerald-50/15 rounded-3xl gap-3.5 shadow-sm"
                    >
                      <span className="text-2xl">🎉</span>
                      <h4 className="text-sm font-black text-stone-900 tracking-tight">Profile Setup Complete!</h4>
                      <p className="text-[9px] text-stone-500 font-bold uppercase tracking-wider leading-relaxed max-w-xs">
                        Your details are 100% complete. Enjoy bonus starting privileges!
                      </p>
                      
                      {/* Circular Trust Score Indicator */}
                      <div className="relative w-24 h-24 flex items-center justify-center mt-1">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="stroke-stone-105"
                            strokeWidth="8"
                            fill="none"
                          />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="40"
                            className="stroke-emerald-500"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray="251.2"
                            initial={{ strokeDashoffset: 251.2 }}
                            animate={{ strokeDashoffset: 251.2 - (251.2 * 80) / 100 }}
                            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-stone-900">
                            <NumberTicker value={80} duration={1200} />
                          </span>
                          <span className="text-[7px] font-black uppercase text-stone-400 tracking-widest mt-0.5">Trust Score</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex gap-3 border-t border-stone-100 pt-4 mt-1">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 h-11 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-bold cursor-pointer"
            >
              Previous
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 h-11 bg-stone-900 text-white hover:bg-stone-850 rounded-xl text-xs font-bold cursor-pointer"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={submitting}
              className="flex-1 h-11 bg-primary text-white hover:bg-primary-dark rounded-xl text-xs font-black uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Submitting Details...' : 'Finish Setup'}
            </button>
          )}
        </div>

      </motion.div>
    </div>
  )
}

export default Onboarding
