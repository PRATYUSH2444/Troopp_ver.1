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

const DEFAULT_CITIES_FALLBACK = [
  { id: '11111111-1111-1111-1111-111111111111', city_name: 'Mumbai' },
  { id: '22222222-2222-2222-2222-222222222222', city_name: 'Delhi NCR' },
  { id: '33333333-3333-3333-3333-333333333333', city_name: 'Bengaluru' },
  { id: '44444444-4444-4444-4444-444444444444', city_name: 'Hyderabad' },
  { id: '55555555-5555-5555-5555-555555555555', city_name: 'Ahmedabad' },
  { id: '66666666-6666-6666-6666-666666666666', city_name: 'Pune' },
  { id: '77777777-7777-7777-7777-777777777777', city_name: 'Chennai' },
  { id: '88888888-8888-8888-8888-888888888888', city_name: 'Kolkata' },
  { id: '99999999-9999-9999-9999-999999999999', city_name: 'Jaipur' },
  { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', city_name: 'Surat' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', city_name: 'Goa' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', city_name: 'Chandigarh' }
]

const Onboarding = () => {
  const [step, setStep] = useState(1)
  const [cities, setCities] = useState(DEFAULT_CITIES_FALLBACK)
  const [submitting, setSubmitting] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const navigate = useNavigate()
  const { setUser } = useAuth()

  // Onboarding details
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState('prefer_not_to_say')
  const [cityId, setCityId] = useState('22222222-2222-2222-2222-222222222222') // Delhi NCR default
  const [selectedTags, setSelectedTags] = useState([])
  
  // Emergency contact details
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyRelation, setEmergencyRelation] = useState('')

  const [trustScore, setTrustScore] = useState(50)

  // Onboarding completion calculations
  const calculateCompletion = () => {
    let score = 0
    if (bio.trim().length >= 10) score += 34
    if (emergencyName.trim().length >= 2 && emergencyPhone.length === 10 && emergencyRelation.trim().length >= 2) score += 33
    if (selectedTags.length >= 3) score += 33
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
    // Load dynamic data on mount
    const loadData = async () => {
      try {
        // Fetch Cities
        const citiesRes = await apiRequest('/cities')
        let loadedCityId = ''
        if (citiesRes.ok) {
          const citiesData = await citiesRes.json()
          const list = citiesData.data || []
          setCities(list)
          if (list.length > 0) {
            loadedCityId = list[0].id
            setCityId(list[0].id)
          }
        }

        // Fetch existing profile
        const profileRes = await apiRequest('/profiles/me')
        if (profileRes.ok) {
          const profileResult = await profileRes.json()
          const profileData = profileResult.data
          
          if (profileData.profile) {
            setBio(profileData.profile.bio || '')
            setGender(profileData.profile.gender || 'prefer_not_to_say')
            if (profileData.cityId) {
              setCityId(profileData.cityId)
            } else if (loadedCityId) {
              setCityId(loadedCityId)
            }
          }
          if (profileData.interestTags) {
            setSelectedTags(profileData.interestTags)
          }

          if (profileData.trustScore !== undefined) {
            setTrustScore(profileData.trustScore)
          }

          // Fetch emergency contacts
          const emergencyRes = await apiRequest('/profiles/emergency-contacts')
          let hasEmergency = false
          if (emergencyRes.ok) {
            const emergencyData = await emergencyRes.json()
            const contacts = emergencyData.data || []
            if (contacts.length > 0) {
              setEmergencyName(contacts[0].name || '')
              setEmergencyRelation(contacts[0].relationship || '')
              const ph = contacts[0].phone || ''
              setEmergencyPhone(ph.startsWith('+91') ? ph.substring(3) : ph)
              hasEmergency = true
            }
          }

          // Determine starting step dynamically
          const bioCompleted = (profileData.profile?.bio || '').trim().length >= 10
          const hasTags = (profileData.interestTags || []).length >= 3

          if (!bioCompleted) {
            setStep(1)
          } else if (!hasEmergency) {
            setStep(2)
          } else if (!hasTags) {
            setStep(3)
          } else {
            setStep(3)
          }
        }
      } catch (err) {
        console.error('Failed loading onboarding baseline data:', err)
      } finally {
        setLoadingProfile(false)
      }
    }
    loadData()
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

  const isStepValid = () => {
    if (step === 1) {
      return bio.trim().length >= 10 && cityId
    }
    if (step === 2) {
      const cleaned = emergencyPhone.replace(/\D/g, '')
      return emergencyName.trim().length >= 2 && emergencyRelation.trim().length >= 2 && cleaned.length === 10
    }
    if (step === 3) {
      return selectedTags.length >= 3
    }
    return true
  }

  const handleStepContinue = async () => {
    if (step === 1) {
      if (bio.trim().length < 10) {
        return toast.error('Tagline bio must be at least 10 characters.')
      }
      if (!cityId) {
        return toast.error('Please select your home city.')
      }

      setSubmitting(true)
      try {
        const profileRes = await apiRequest('/profiles/me', {
          method: 'PUT',
          body: JSON.stringify({
            bio: bio.trim(),
            gender,
            cityId
          })
        })
        if (!profileRes.ok) {
          const errData = await profileRes.json()
          throw new Error(errData.error?.message || 'Failed to save profile details.')
        }
        setStep(2)
      } catch (err) {
        toast.error(err.message)
      } finally {
        setSubmitting(false)
      }
    } else if (step === 2) {
      if (emergencyName.trim().length < 2) {
        return toast.error('Emergency contact name must be at least 2 characters.')
      }
      if (emergencyRelation.trim().length < 2) {
        return toast.error('Relationship description must be at least 2 characters.')
      }
      const cleanedPhone = emergencyPhone.replace(/\D/g, '')
      if (cleanedPhone.length !== 10) {
        return toast.error('Please enter a valid 10-digit mobile number.')
      }

      setSubmitting(true)
      try {
        const res = await apiRequest('/profiles/emergency-contacts', {
          method: 'POST',
          body: JSON.stringify({
            name: emergencyName.trim(),
            phone: `+91${cleanedPhone}`,
            relationship: emergencyRelation.trim()
          })
        })
        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error?.message || 'Failed to save emergency contact.')
        }
        setStep(3)
      } catch (err) {
        toast.error(err.message)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleComplete = async () => {
    if (selectedTags.length < 3) {
      return toast.error('Please select at least 3 vibe tags to complete your profile.')
    }

    setSubmitting(true)
    try {
      // 1. Submit Profile details (interest tags)
      const profileRes = await apiRequest('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify({
          interestTags: selectedTags
        })
      })
      if (!profileRes.ok) {
        const errData = await profileRes.json()
        throw new Error(errData.error?.message || 'Failed to save interest tags.')
      }

      // 2. Complete Onboarding flag update
      const completeRes = await apiRequest('/profiles/complete-onboarding', {
        method: 'POST'
      })

      if (completeRes.ok) {
        const data = await completeRes.json()
        if (data.accessToken) {
          const { setAccessToken } = await import('../utils/api.js')
          setAccessToken(data.accessToken)
        }
        toast.success('Onboarding complete! Enjoy your journeys.')
        setUser((prev) => ({ ...prev, onboardingCompleted: true }))
        navigate('/feed', { replace: true })
      } else {
        const errData = await completeRes.json()
        throw new Error(errData.error?.message || 'Onboarding completion confirmation failed.')
      }

    } catch (err) {
      toast.error(err.message || 'Verification or save failed. Please review fields.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">
            Loading your profile...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen px-4 py-12 flex items-center justify-center"
      style={{
        background: 'radial-gradient(circle at 30% 20%, rgba(255,106,44,0.12) 0%, transparent 60%), #10151a',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Responsive stylesheet auth theme authority */}
      <style>{`
        .wizard-card {
          background: #1a2129;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.03) inset;
          overflow: hidden;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        .wizard-header {
          background: linear-gradient(160deg, #1c2a2a 0%, #1a2129 100%);
          padding: 32px 32px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          box-sizing: border-box;
        }
        .wizard-body {
          padding: 32px 32px 36px;
          box-sizing: border-box;
        }
        .wizard-input {
          width: 100%;
          height: 52px;
          padding: 0 24px;
          background: #212b33;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px;
          font-size: 15px;
          color: #f3f1ea;
          transition: border-color 150ms ease, box-shadow 150ms ease;
          outline: none;
          box-sizing: border-box;
        }
        .wizard-input:focus {
          border-color: #ff6a2c;
          box-shadow: 0 0 0 3px rgba(255,106,44,0.20);
        }
        .wizard-textarea {
          width: 100%;
          padding: 16px 20px;
          background: #212b33;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          font-size: 15px;
          color: #f3f1ea;
          outline: none;
          box-sizing: border-box;
          resize: none;
          line-height: 1.5;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }
        .wizard-textarea:focus {
          border-color: #ff6a2c;
          box-shadow: 0 0 0 3px rgba(255,106,44,0.20);
        }
        .wizard-select {
          width: 100%;
          height: 52px;
          padding: 0 20px;
          background: #212b33;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px;
          font-size: 15px;
          color: #f3f1ea;
          outline: none;
          box-sizing: border-box;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ba6ad' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 20px center;
          background-size: 16px;
        }
        .wizard-select:focus {
          border-color: #ff6a2c;
          box-shadow: 0 0 0 3px rgba(255,106,44,0.20);
        }
        @media (max-width: 480px) {
          .wizard-header {
            padding: 24px 20px 20px;
          }
          .wizard-body {
            padding: 24px 20px 28px;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="wizard-card"
      >
        {/* WIZARD HEADER & TIMELINE */}
        <div className="wizard-header" style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          padding: '24px 32px'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#9ba6ad', letterSpacing: '0.02em' }}>
            Step {step} of 3, {completionPercent}% completed
          </span>

          {/* Rebuilt Progress Stepper Node Layout */}
          <div className="relative flex items-center justify-between w-[260px] h-10 px-1">
            {/* Background Track Line */}
            <div className="absolute left-0 right-0 h-0.5 bg-[#2c3742] z-0" style={{ top: '50%', transform: 'translateY(-50%)' }} />
            
            {/* Animated Foreground Progress Line */}
            <motion.div
              className="absolute left-0 h-0.5 bg-[#4fbe8e] z-0"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
              initial={{ width: '0%' }}
              animate={{ width: `${((step - 1) / 2) * 100}%` }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
            />

            {/* Step Circular Nodes */}
            {[1, 2, 3].map((s) => {
              const isCompleted = s < step;
              const isActive = s === step;
              return (
                <div key={s} className="relative z-10 flex items-center justify-center">
                  <motion.div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '13px',
                      border: '2px solid',
                      borderColor: isCompleted
                        ? '#4fbe8e'
                        : isActive
                        ? '#ff6a2c'
                        : 'rgba(255,255,255,0.08)',
                      background: isCompleted
                        ? '#4fbe8e'
                        : isActive
                        ? 'linear-gradient(135deg, #ff8a4c 0%, #ff520d 100%)'
                        : '#1a2129',
                      color: isCompleted
                        ? '#ffffff'
                        : isActive
                        ? '#ffffff'
                        : '#6b757c',
                      boxShadow: isActive ? '0 0 16px rgba(255,106,44,0.6)' : 'none',
                      cursor: 'default',
                      userSelect: 'none'
                    }}
                    animate={isActive ? { scale: 1.08 } : { scale: 1.0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {isCompleted ? (
                      <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      s
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* WIZARD BODY */}
        <div className="wizard-body">
          {/* Step 1: Bio */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#f3f1ea',
                  letterSpacing: '-0.02em'
                }}>
                  Tell us about yourself
                </h3>
              </div>

              <div className="flex flex-col">
                <label style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#9ba6ad',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Tell us your tagline bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  placeholder="Day dreamer, trek lover, or weekend driver..."
                  className="wizard-textarea"
                />
                <div style={{ display: 'flex', justifycontent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Min 10 characters required
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {bio.length}/500
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#9ba6ad',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Gender
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="wizard-select"
                    >
                      <option value="male" style={{ background: '#1a2129', color: '#f3f1ea' }}>Male</option>
                      <option value="female" style={{ background: '#1a2129', color: '#f3f1ea' }}>Female</option>
                      <option value="other" style={{ background: '#1a2129', color: '#f3f1ea' }}>Other</option>
                      <option value="prefer_not_to_say" style={{ background: '#1a2129', color: '#f3f1ea' }}>Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#9ba6ad',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Home City
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={cityId}
                      onChange={(e) => setCityId(e.target.value)}
                      className="wizard-select"
                    >
                      {cities.map((city) => (
                        <option key={city.id} value={city.id} style={{ background: '#1a2129', color: '#f3f1ea' }}>
                          {city.city_name || city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Emergency Contact */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#f3f1ea',
                  letterSpacing: '-0.02em',
                  marginBottom: '2px'
                }}>
                  Emergency Contact
                </h3>
                <span style={{ fontSize: '13px', color: '#9ba6ad', lineHeight: '1.4' }}>
                  Safety first: register someone we can alert in emergency situations.
                </span>
              </div>

              <div className="flex flex-col">
                <label style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#9ba6ad',
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Contact Full Name
                </label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Ramesh Malhotra"
                  className="wizard-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#9ba6ad',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    placeholder="Father / Friend"
                    className="wizard-input"
                  />
                </div>

                <div className="flex flex-col">
                  <label style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#9ba6ad',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    Mobile Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '20px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#6b757c',
                      pointerEvents: 'none'
                    }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="wizard-input"
                      style={{ paddingLeft: '54px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2" style={{ textAlign: 'center' }}>
                <h3 style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#f3f1ea',
                  letterSpacing: '-0.02em',
                }}>
                  Select Interest Vibe Tags
                </h3>
              </div>

              <div className="flex flex-wrap gap-2.5 py-3 justify-center">
                {AVAILABLE_TAGS.map((tag) => {
                  const selected = selectedTags.includes(tag)
                  return (
                    <motion.button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '100px',
                        fontSize: '13.5px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        border: selected ? 'none' : '1px solid rgba(255,255,255,0.12)',
                        background: selected
                          ? 'linear-gradient(135deg, #ff8a4c 0%, #ff520d 100%)'
                          : 'transparent',
                        color: selected ? '#ffffff' : '#9ba6ad',
                        boxShadow: selected
                          ? '0 0 16px rgba(255,106,44,0.4)'
                          : 'none',
                        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseOver={(e) => {
                        if (!selected) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'
                          e.currentTarget.style.color = '#ffffff'
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!selected) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                          e.currentTarget.style.color = '#9ba6ad'
                        }
                      }}
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
                    className="flex flex-col gap-6 mt-2"
                  >
                    <div className="flex items-center justify-center">
                      <div style={{
                        fontSize: '12.5px',
                        fontWeight: '600',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.16)',
                        padding: '8px 18px',
                        borderRadius: '100px',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.05)'
                      }}>
                        <svg style={{ width: '15px', height: '15px', fill: 'currentColor' }} viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Ready to proceed (Minimum 3 tags selected)</span>
                      </div>
                    </div>

                    {completionPercent === 100 && (
                      <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          padding: '24px 20px',
                          border: '1.5px solid #4fbe8e',
                          background: '#152520',
                          borderRadius: '16px',
                          boxShadow: '0 0 20px rgba(79,190,142,0.25)',
                          gap: '16px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <h4 style={{
                          fontFamily: 'Space Grotesk, sans-serif',
                          fontSize: '18px',
                          fontWeight: '700',
                          color: '#ffffff',
                          letterSpacing: '-0.01em',
                          margin: 0
                        }}>
                          Profile Setup Complete!
                        </h4>
                        
                        {/* Circular Trust Score Indicator */}
                        <div className="relative w-28 h-28 flex items-center justify-center" style={{ filter: 'drop-shadow(0 4px 12px rgba(79,190,142,0.2))' }}>
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="rgba(255,255,255,0.04)"
                              strokeWidth="5"
                              fill="none"
                            />
                            <motion.circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#4fbe8e"
                              strokeWidth="6"
                              strokeLinecap="round"
                              fill="none"
                              strokeDasharray="251.2"
                              initial={{ strokeDashoffset: 251.2 }}
                              animate={{ strokeDashoffset: 251.2 - (251.2 * (trustScore || 50)) / 100 }}
                              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '2px' }}>
                            <span style={{
                              fontSize: '28px',
                              fontWeight: '800',
                              color: '#ffffff',
                              fontFamily: 'Space Grotesk, sans-serif',
                              letterSpacing: '-0.02em',
                              lineHeight: '1'
                            }}>
                              <NumberTicker value={trustScore || 80} duration={1400} />
                            </span>
                            <span style={{
                              fontSize: '8px',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              color: '#9ba6ad',
                              letterSpacing: '0.04em',
                              marginTop: '2px',
                              whiteSpace: 'nowrap'
                            }}>
                              Peer Trust Index
                            </span>
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
          <div style={{
            display: 'flex',
            gap: '12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '24px',
            marginTop: '24px'
          }}>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={submitting}
                type="button"
                style={{
                  flex: 1,
                  height: '52px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '100px',
                  color: '#9ba6ad',
                  fontSize: '14.5px',
                  fontWeight: '600',
                  fontFamily: 'Space Grotesk, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  e.currentTarget.style.color = '#ffffff'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#9ba6ad'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Previous
              </button>
            )}
            
            <button
              onClick={step < 3 ? handleStepContinue : handleComplete}
              disabled={submitting || !isStepValid()}
              type="button"
              style={{
                flex: 1,
                height: '52px',
                background: isStepValid()
                  ? 'linear-gradient(135deg, #ff8a4c 0%, #ff520d 100%)'
                  : 'rgba(255,106,44,0.12)',
                color: isStepValid() ? '#1a0e08' : 'rgba(255,255,255,0.25)',
                fontWeight: '700',
                fontSize: '14.5px',
                fontFamily: 'Space Grotesk, sans-serif',
                border: 'none',
                borderRadius: '100px',
                cursor: isStepValid() ? 'pointer' : 'not-allowed',
                boxShadow: isStepValid() ? '0 0 16px rgba(255,106,44,0.4)' : 'none',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                if (isStepValid()) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 0 24px rgba(255,106,44,0.6)'
                }
              }}
              onMouseOut={(e) => {
                if (isStepValid()) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 0 16px rgba(255,106,44,0.4)'
                }
              }}
              onMouseDown={(e) => {
                if (isStepValid()) {
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              {submitting 
                ? (step < 3 ? 'Saving...' : 'Completing...') 
                : (step < 3 ? 'Continue' : 'Finish Setup')
              }
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Onboarding
