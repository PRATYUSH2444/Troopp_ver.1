import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'

const ResetPassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      toast.error('Reset token is invalid or missing.')
      navigate('/login')
    }
  }, [token, navigate])

  const validatePassword = (pw) => {
    if (pw.length < 8) return 'Password must be at least 8 characters long.'
    if (!/(?=.*[a-z])/.test(pw)) return 'Password must contain at least one lowercase letter.'
    if (!/(?=.*[A-Z])/.test(pw)) return 'Password must contain at least one uppercase letter.'
    if (!/(?=.*\d)/.test(pw)) return 'Password must contain at least one number.'
    if (!/(?=.*[@$!%*?&])/.test(pw)) return 'Password must contain at least one special character (@$!%*?&).'
    return null
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match.')
    }
    
    const passwordError = validatePassword(password)
    if (passwordError) return toast.error(passwordError)

    setSubmitting(true)
    try {
      const res = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to reset password.')
      }

      toast.success('Password successfully reset! Please login with your new password.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Reset password request failed.')
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
        .reset-card {
          background: #1a2129;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.03) inset;
          overflow: hidden;
        }
        .reset-header {
          background: linear-gradient(160deg, #1c2a2a 0%, #1a2129 100%);
          padding: 40px 40px 28px;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .reset-body {
          padding: 32px 40px 40px;
        }
        .reset-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #9ba6ad;
          margin-bottom: 6px;
          display: block;
          padding-left: 2px;
        }
        .reset-input {
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
        .reset-input:focus {
          border-color: #ff6a2c;
          box-shadow: 0 0 0 3px rgba(255,106,44,0.20);
        }
        .reset-btn {
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
        .reset-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(255, 106, 44, 0.35);
        }
        .reset-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .reset-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (max-width: 480px) {
          .reset-header {
            padding: 28px 24px 20px;
          }
          .reset-body {
            padding: 24px 24px 28px;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="reset-card"
      >
        {/* CARD HEADER */}
        <div className="reset-header">
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
            Reset Password
          </h2>
          <p style={{ fontSize: '11px', fontWeight: '600', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
            Enter your new password below
          </p>
        </div>

        {/* CARD BODY */}
        <div className="reset-body">
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label className="reset-label">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="reset-input"
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

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label className="reset-label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="reset-input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="reset-btn"
              style={{ marginTop: '4px' }}
            >
              {submitting ? 'Resetting Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default ResetPassword
