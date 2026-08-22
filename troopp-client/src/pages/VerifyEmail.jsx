import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import { haptics } from '../utils/haptics.js'
import OTPInput from '../components/common/OTPInput.jsx'
import SignupStepIndicator from '../components/auth/SignupStepIndicator.jsx'

/**
 * Signup Step 2: Email OTP verification viewport.
 * Exclusively dark mode theme matching the Sign Up Page.
 */
const VerifyEmail = () => {
  const [code, setCode] = useState('')
  const [hasError, setHasError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(30)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email')

  useEffect(() => {
    if (!email) {
      toast.error('Missing email parameter in verification URL.')
      navigate('/signup')
    }
  }, [email, navigate])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    haptics.lightTap()
    try {
      const res = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to resend verification code.')
      }
      haptics.success()
      toast.success('New verification code sent to your email!')
      setResendCooldown(30)
    } catch (err) {
      haptics.error()
      toast.error(err.message || 'Failed to resend code.')
    } finally {
      setResending(false)
    }
  }

  const handleVerify = async (otpCode) => {
    const activeCode = otpCode || code
    if (activeCode.length !== 6 || !/^\d+$/.test(activeCode)) {
      return toast.error('Please enter a valid 6-digit numeric verification code.')
    }

    setSubmitting(true)
    setHasError(false)
    haptics.lightTap()
    try {
      const res = await apiRequest('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email, code: activeCode })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Email verification failed.')
      }

      haptics.success()
      toast.success('Email address successfully verified!')
      navigate(`/signup/verify-phone?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setHasError(true)
      haptics.error()
      toast.error(err.message || 'Verification failed. Please check the code and try again.')
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
          width: 100%;
          max-width: 440px;
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
          <div style={{ marginBottom: '14px', width: '100%' }}>
            <SignupStepIndicator currentStep={2} />
          </div>

          <h2 style={{
            fontFamily: 'Space Grotesk',
            fontSize: '26px',
            fontWeight: '700',
            color: '#f3f1ea',
            letterSpacing: '-0.02em',
            marginBottom: '6px'
          }}>Verify Your Email</h2>
          <p style={{ fontSize: '14px', color: '#9ba6ad', textAlign: 'center' }}>
            Enter the 6-digit code sent to <span style={{ color: '#ff6a2c', fontWeight: '700' }}>{email}</span>
          </p>
        </div>

        {/* CARD BODY */}
        <div className="signup-body">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleVerify()
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
                Verification Code
              </label>
              <OTPInput
                onComplete={(otp) => {
                  setCode(otp)
                  handleVerify(otp)
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
              {submitting ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend Code Action */}
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <p style={{ fontSize: '13.5px', color: '#9ba6ad' }}>
                Didn't receive the email?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#6b757c' : '#ff6a2c',
                    fontWeight: '600',
                    cursor: resendCooldown > 0 ? 'default' : 'pointer',
                    padding: '0 4px',
                    fontSize: '13.5px'
                  }}
                >
                  {resending
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Code'}
                </button>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default VerifyEmail
export { VerifyEmail }
