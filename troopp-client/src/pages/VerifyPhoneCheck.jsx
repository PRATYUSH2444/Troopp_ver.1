import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import { haptics } from '../utils/haptics.js'
import OTPInput from '../components/common/OTPInput.jsx'
import SignupStepIndicator from '../components/auth/SignupStepIndicator.jsx'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Signup Step 4: Phone OTP verification.
 * Exclusively dark mode theme matching the Sign Up Page.
 */
const VerifyPhoneCheck = () => {
  const [code, setCode] = useState('')
  const [hasError, setHasError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const email = searchParams.get('email') || user?.email
  const phone = searchParams.get('phone')

  useEffect(() => {
    if ((!email || !phone) && !isAuthenticated) {
      toast.error('Missing verification details.')
      navigate('/signup')
    }
  }, [email, phone, isAuthenticated, navigate])

  const handleVerifySMS = async (otpCode) => {
    const activeCode = otpCode || code
    if (activeCode.length !== 6 || !/^\d+$/.test(activeCode)) {
      return toast.error('Please enter a valid 6-digit SMS verification code.')
    }

    setSubmitting(true)
    setHasError(false)
    haptics.lightTap()
    try {
      const endpoint = isAuthenticated ? '/profiles/verify-phone/check' : '/auth/verify-phone/check'
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ phone, code: activeCode })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Phone verification failed.')
      }

      haptics.success()
      toast.success('Mobile number successfully verified!')
      if (isAuthenticated) {
        navigate('/profile/me/settings')
      } else {
        navigate(`/signup/complete?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`)
      }
    } catch (err) {
      setHasError(true)
      haptics.error()
      toast.error(err.message || 'Incorrect code. Please try again.')
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
          {!isAuthenticated && (
            <div style={{ marginBottom: '14px', width: '100%' }}>
              <SignupStepIndicator currentStep={4} />
            </div>
          )}

          {isAuthenticated && (
            <button
              onClick={() => navigate('/profile/me/verify-phone')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ba6ad',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ← Back
            </button>
          )}

          <h2 style={{
            fontFamily: 'Space Grotesk',
            fontSize: '26px',
            fontWeight: '700',
            color: '#f3f1ea',
            letterSpacing: '-0.02em',
            marginBottom: '6px'
          }}>Verify SMS Code</h2>
          <p style={{ fontSize: '14px', color: '#9ba6ad', textAlign: 'center' }}>
            Enter the 6-digit code sent to <span style={{ color: '#ff6a2c', fontWeight: '700' }}>{phone}</span>
          </p>
        </div>

        {/* CARD BODY */}
        <div className="signup-body">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleVerifySMS()
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <label style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#9ba6ad',
                alignSelf: 'flex-start',
                paddingLeft: '4px'
              }}>
                SMS Code
              </label>
              <OTPInput
                onComplete={(otp) => {
                  setCode(otp)
                  handleVerifySMS(otp)
                }}
                hasError={hasError}
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || code.length !== 6}
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
              {submitting ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default VerifyPhoneCheck
export { VerifyPhoneCheck }
