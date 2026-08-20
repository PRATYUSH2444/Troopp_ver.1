import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest, setAccessToken } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { haptics } from '../utils/haptics.js'
import Checkbox from '../components/common/Checkbox.jsx'
import SignupStepIndicator from '../components/auth/SignupStepIndicator.jsx'

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

/**
 * Signup Step 5: Profile finalization and password creation.
 * Exclusively dark mode theme matching the Sign Up Page.
 */
const CompleteSignup = () => {
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('prefer_not_to_say')
  const [cityId, setCityId] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [tosAccepted, setTosAccepted] = useState(false)
  const [cities, setCities] = useState([])
  
  const [submitting, setSubmitting] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser, setIsAuthenticated } = useAuth()
  
  const email = searchParams.get('email')
  const phone = searchParams.get('phone')

  useEffect(() => {
    if (!email) {
      toast.error('Session details expired. Please start over.')
      navigate('/signup')
      return
    }

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
  }, [email, navigate])

  const toggleTag = (tag) => {
    haptics.lightTap()
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const validatePassword = (pw) => {
    if (pw.length < 8) return 'Password must be at least 8 characters long.'
    if (!/(?=.*[a-z])/.test(pw)) return 'Password must contain at least one lowercase letter.'
    if (!/(?=.*[A-Z])/.test(pw)) return 'Password must contain at least one uppercase letter.'
    if (!/(?=.*\d)/.test(pw)) return 'Password must contain at least one number.'
    if (!/(?=.*[@$!%*?&])/.test(pw)) return 'Password must contain at least one special character (@$!%*?&).'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) return toast.error('Name is required.')
    if (!password) return toast.error('Password is required.')
    
    const passwordError = validatePassword(password)
    if (passwordError) return toast.error(passwordError)

    if (!dob) return toast.error('Date of birth is required for age check.')
    if (!tosAccepted) return toast.error('You must accept the Terms of Service.')

    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    if (age < 18) {
      return toast.error('You must be at least 18 years old to join Troopp.')
    }

    setSubmitting(true)
    haptics.lightTap()
    try {
      const res = await apiRequest('/auth/complete-signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          name: name.trim(),
          dob,
          tos_accepted: tosAccepted,
          gender,
          city_id: cityId,
          interest_tags: selectedTags
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to complete registration.')
      }

      haptics.success()
      setAccessToken(data.accessToken)
      setUser(data.user)
      setIsAuthenticated(true)
      toast.success('Registration completed! Welcome to Troopp.')
      navigate('/feed')
    } catch (err) {
      haptics.error()
      toast.error(err.message || 'Signup completion failed. Verify fields.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div 
      className="min-h-screen w-full relative flex items-center justify-center px-4 py-8 overflow-x-hidden"
      style={{
        background: 'radial-gradient(circle at 30% 20%, rgba(255,106,44,0.12) 0%, transparent 60%), #10151a',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        .signup-card {
          background: #1a2129;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          width: 500px;
          max-width: calc(100vw - 40px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.03) inset;
          overflow: hidden;
        }
        .signup-header {
          background: linear-gradient(160deg, #1c2a2a 0%, #1a2129 100%);
          padding: 36px 40px 24px;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .signup-body {
          padding: 32px 40px 40px;
        }
        .signup-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9ba6ad;
          margin-bottom: 6px;
          display: block;
          padding-left: 2px;
        }
        .signup-input {
          width: 100%;
          height: 50px;
          padding: 0 16px;
          background: #212b33;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          font-size: 14px;
          color: #f3f1ea;
          transition: border-color 150ms ease, box-shadow 150ms ease;
          outline: none;
          box-sizing: border-box;
        }
        .signup-input:focus {
          border-color: #ff6a2c;
          box-shadow: 0 0 0 3px rgba(255,106,44,0.20);
        }
        select.signup-input {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ba6ad' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 16px center;
          background-size: 16px;
          padding-right: 40px;
        }
        select.signup-input option {
          background-color: #212b33;
          color: #f3f1ea;
        }
        input[type="date"].signup-input::-webkit-calendar-picker-indicator {
          filter: invert(0.7);
          cursor: pointer;
        }
        @media (max-width: 480px) {
          .signup-header {
            padding: 28px 24px 20px;
          }
          .signup-body {
            padding: 24px 24px 28px;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="signup-card"
      >
        {/* CARD HEADER */}
        <div className="signup-header">
          {/* Logo Mark */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(155deg, #ff6a2c, #d9481a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Space Grotesk',
            fontWeight: '700',
            fontSize: '20px',
            color: 'white',
            boxShadow: '0 4px 14px rgba(255,106,44,0.35)',
            marginBottom: '18px'
          }}>T</div>

          {/* Step Indicator */}
          <div style={{ marginBottom: '14px', width: '100%' }}>
            <SignupStepIndicator currentStep={5} />
          </div>

          <h2 style={{
            fontFamily: 'Space Grotesk',
            fontSize: '26px',
            fontWeight: '700',
            color: '#f3f1ea',
            letterSpacing: '-0.02em',
            marginBottom: '6px'
          }}>Complete Profile</h2>
          <p style={{ fontSize: '14px', color: '#9ba6ad' }}>
            Fill in details to establish your account
          </p>
        </div>

        {/* CARD BODY */}
        <div className="signup-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="signup-label">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Raj Malhotra"
                  className="signup-input"
                  required
                />
              </div>

              {/* Date of Birth */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="signup-label">Date of Birth (18+)</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="signup-input"
                  required
                />
              </div>

              {/* Gender */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="signup-label">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="signup-input"
                  style={{ color: '#f3f1ea', background: '#212b33' }}
                >
                  <option value="male" style={{ background: '#212b33', color: '#f3f1ea' }}>Male</option>
                  <option value="female" style={{ background: '#212b33', color: '#f3f1ea' }}>Female</option>
                  <option value="other" style={{ background: '#212b33', color: '#f3f1ea' }}>Other</option>
                  <option value="prefer_not_to_say" style={{ background: '#212b33', color: '#f3f1ea' }}>Prefer not to say</option>
                </select>
              </div>

              {/* City */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="signup-label">Home City</label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="signup-input"
                  style={{ color: '#f3f1ea', background: '#212b33' }}
                  required
                >
                  {cities.map((city) => (
                    <option key={city.id} value={city.id} style={{ background: '#212b33', color: '#f3f1ea' }}>
                      {city.city_name || city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label className="signup-label">Create Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="signup-input"
                required
              />
              {password.length > 0 && (
                <div style={{
                  marginTop: '10px',
                  padding: '12px 16px',
                  background: '#212b33',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {[
                    { label: 'At least 8 characters', met: password.length >= 8 },
                    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
                    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
                    { label: 'One number', met: /\d/.test(password) },
                    { label: 'One special character (@$!%*?&)', met: /[@$!%*?&]/.test(password) }
                  ].map((req, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: req.met ? '#10b981' : '#9ba6ad',
                      transition: 'color 150ms ease'
                    }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: req.met ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: req.met ? '#10b981' : '#6b757c',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        border: req.met ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.08)'
                      }}>
                        {req.met ? '✓' : '•'}
                      </span>
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interest vibe tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="signup-label">Select Interest Vibe Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {AVAILABLE_TAGS.map((tag) => {
                  const selected = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '100px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: selected ? '1px solid #ff6a2c' : '1px solid rgba(255,255,255,0.08)',
                        background: selected ? 'rgba(255,106,44,0.16)' : '#212b33',
                        color: selected ? '#ff6a2c' : '#9ba6ad',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* TOS checkbox */}
            <Checkbox
              checked={tosAccepted}
              onChange={setTosAccepted}
              className="mt-2 px-1"
              label={
                <span style={{ fontSize: '11px', fontWeight: '500', color: '#9ba6ad' }}>
                  I accept the{' '}
                  <a href="/terms" target="_blank" style={{ color: '#ff6a2c', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" style={{ color: '#ff6a2c', textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                    Privacy Policy
                  </a>
                </span>
              }
            />

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                height: '52px',
                marginTop: '4px',
                background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                color: '#1a0e08',
                fontWeight: '700',
                fontSize: '15px',
                fontFamily: 'Space Grotesk, sans-serif',
                border: 'none',
                borderRadius: '100px',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(255,106,44,0.28)',
                transition: 'transform 150ms ease, box-shadow 150ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(255,106,44,0.38)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(255,106,44,0.28)'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {submitting ? 'Creating Profile...' : 'Complete Profile Setup'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default CompleteSignup
export { CompleteSignup }
