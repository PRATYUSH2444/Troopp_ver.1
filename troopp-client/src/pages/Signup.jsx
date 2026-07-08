import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import { haptics } from '../utils/haptics.js'
import SignupStepIndicator from '../components/auth/SignupStepIndicator.jsx'

/**
 * Premium Signup Step 1: Account email initialization.
 * Exclusively dark mode theme matching the LoginPage.
 */
const Signup = () => {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!email) {
      return toast.error('Please enter your email address.')
    }

    setSubmitting(true)
    haptics.lightTap()
    try {
      const res = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to initialize registration.')
      }

      haptics.success()
      toast.success('Email verification code sent to your email!')
      navigate(`/signup/verify-email?email=${encodeURIComponent(email)}`)
    } catch (err) {
      haptics.error()
      toast.error(err.message || 'Failed to submit registration request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 30% 20%, rgba(255,106,44,0.12) 0%, transparent 60%), #10151a',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      {/* CSS overrides for responsive inputs and headings */}
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
          padding: 0 44px;
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
            <SignupStepIndicator currentStep={1} />
          </div>

          <h2 style={{
            fontFamily: 'Space Grotesk',
            fontSize: '26px',
            fontWeight: '700',
            color: '#f3f1ea',
            letterSpacing: '-0.02em',
            marginBottom: '6px'
          }}>Create your account</h2>
          <p style={{ fontSize: '14px', color: '#9ba6ad' }}>
            Enter your email to get started
          </p>
        </div>

        {/* CARD BODY */}
        <div className="signup-body">
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Email Field */}
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
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="explorer@email.com"
                  className="signup-input"
                  required
                />
                <span style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b757c',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </span>
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
              {submitting ? 'Sending verification code...' : 'Continue'}
            </button>
          </form>

          {/* Footer Link redirect */}
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#9ba6ad' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              onClick={() => haptics.lightTap()}
              style={{ color: '#ff6a2c', fontWeight: '600' }}
            >
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Signup
export { Signup }
