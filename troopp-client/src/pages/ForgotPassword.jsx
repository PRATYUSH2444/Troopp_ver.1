import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!email) {
      return toast.error('Please enter your email address.')
    }

    setSubmitting(true)
    try {
      const res = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to request reset.')
      }

      setSent(true)
      toast.success('Password reset email sent!')
    } catch (err) {
      toast.error(err.message || 'Forgot password request failed.')
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
      <style>{`
        .forgot-card {
          background: #1a2129;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.03) inset;
          overflow: hidden;
        }
        .forgot-header {
          background: linear-gradient(160deg, #1c2a2a 0%, #1a2129 100%);
          padding: 40px 40px 28px;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .forgot-body {
          padding: 32px 40px 40px;
        }
        .forgot-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9ba6ad;
          margin-bottom: 6px;
          display: block;
          padding-left: 2px;
        }
        .forgot-input {
          width: 100%;
          height: 52px;
          padding: 0 20px;
          background: #212b33;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          font-size: 15px;
          color: #f3f1ea;
          transition: border-color 150ms ease, box-shadow 150ms ease;
          outline: none;
          box-sizing: border-box;
        }
        .forgot-input:focus {
          border-color: #ff6a2c;
          box-shadow: 0 0 0 3px rgba(255,106,44,0.20);
        }
        .forgot-btn {
          width: 100%;
          height: 50px;
          background: linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%);
          color: #1a0e08;
          font-weight: 600;
          font-size: 14.5px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255, 106, 44, 0.25);
          transition: transform 150ms ease, box-shadow 150ms ease;
        }
        .forgot-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(255, 106, 44, 0.35);
        }
        .forgot-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .forgot-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .success-box {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .success-text {
          font-size: 14px;
          color: #10b981;
          line-height: 1.6;
        }
        @media (max-width: 480px) {
          .forgot-header {
            padding: 28px 24px 20px;
          }
          .forgot-body {
            padding: 24px 24px 28px;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="forgot-card"
      >
        {/* CARD HEADER */}
        <div className="forgot-header">
          {/* Logo Mark */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(155deg, #ff6a2c, #d9481a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: '700',
            fontSize: '18px',
            color: 'white',
            boxShadow: '0 4px 14px rgba(255, 106, 44, 0.3)',
            marginBottom: '16px'
          }}>
            T
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#f3f1ea', margin: '0 0 6px 0', fontFamily: "'Space Grotesk', sans-serif" }}>
            Recover Password
          </h2>
          <p style={{ fontSize: '11px', fontWeight: '600', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Request a password reset link to recover access
          </p>
        </div>

        {/* CARD BODY */}
        <div className="forgot-body">
          {sent ? (
            <div className="success-box">
              <span style={{ fontSize: '28px' }}>📧</span>
              <p className="success-text">
                We have sent a secure password reset link to your email. Please check your inbox and follow the steps.
              </p>
              <Link
                to="/login"
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#ff6a2c',
                  textDecoration: 'none',
                  marginTop: '8px'
                }}
                className="hover:underline"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className="forgot-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="explorer@email.com"
                  className="forgot-input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="forgot-btn"
                style={{ marginTop: '4px' }}
              >
                {submitting ? 'Requesting reset link...' : 'Send Reset Link'}
              </button>
              
              <Link
                to="/login"
                style={{
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#9ba6ad',
                  textDecoration: 'none',
                  marginTop: '4px'
                }}
                className="hover:underline"
              >
                Back to Login
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
