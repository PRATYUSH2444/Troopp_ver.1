import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import { haptics } from '../utils/haptics.js'
import SignupStepIndicator from '../components/auth/SignupStepIndicator.jsx'

/**
 * Signup Step 3: Phone number capture.
 * Exclusively dark mode theme matching the Sign Up Page.
 */
const VerifyPhone = () => {
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email')

  useEffect(() => {
    if (!email) {
      toast.error('Missing email verification token.')
      navigate('/signup')
    }
  }, [email, navigate])

  const handleSendSMS = async (e) => {
    e.preventDefault()
    
    // Auto prefix E.164 +91 if missing, check 10 digits
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length !== 10) {
      return toast.error('Please enter a valid 10-digit mobile number.')
    }
    
    const formattedPhone = `+91${cleaned}`

    setSubmitting(true)
    haptics.lightTap()
    try {
      const res = await apiRequest('/auth/verify-phone', {
        method: 'POST',
        body: JSON.stringify({ email, phone: formattedPhone })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to dispatch SMS.')
      }

      haptics.success()
      toast.success('Verification SMS sent to your phone!')
      navigate(`/signup/verify-phone/check?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(formattedPhone)}`)
    } catch (err) {
      haptics.error()
      toast.error(err.message || 'SMS dispatch failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div 
      className="min-h-screen w-full relative flex items-center justify-center px-4 overflow-hidden"
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
          width: 440px;
          max-width: calc(100vw - 40px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.03) inset;
          overflow: hidden;
        }
        .signup-header {
          background: linear-gradient(160deg, #1c2a2a 0%, #1a2129 100%);
          padding: 40px 40px 28px;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .signup-body {
          padding: 32px 40px 40px;
        }
        .signup-input {
          width: 100%;
          height: 52px;
          background: #212b33;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px;
          font-size: 15px;
          color: #f3f1ea;
          transition: border-color 150ms ease, box-shadow 150ms ease;
          outline: none;
          box-sizing: border-box;
        }
        .signup-input:focus {
          border-color: #ff6a2c;
          box-shadow: 0 0 0 3px rgba(255,106,44,0.20);
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
            <SignupStepIndicator currentStep={3} />
          </div>

          <h2 style={{
            fontFamily: 'Space Grotesk',
            fontSize: '26px',
            fontWeight: '700',
            color: '#f3f1ea',
            letterSpacing: '-0.02em',
            marginBottom: '6px'
          }}>Phone Verification</h2>
          <p style={{ fontSize: '14px', color: '#9ba6ad', textAlign: 'center' }}>
            Enter your mobile number to secure your account
          </p>
        </div>

        {/* CARD BODY */}
        <div className="signup-body">
          <form onSubmit={handleSendSMS} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Phone Number Field */}
            <div>
              <label style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#9ba6ad',
                marginBottom: '6px',
                display: 'block'
              }}>
                Phone Number
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '52px',
                  background: '#212b33',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '100px',
                  fontSize: '15px',
                  fontWeight: '700',
                  color: '#9ba6ad',
                  userSelect: 'none'
                }}>
                  +91
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="signup-input"
                  style={{ paddingLeft: '24px' }}
                  required
                />
              </div>
            </div>

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
              {submitting ? 'Sending SMS...' : 'Send Verification Code'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default VerifyPhone
export { VerifyPhone }
