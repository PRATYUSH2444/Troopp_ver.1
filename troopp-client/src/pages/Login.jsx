import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { haptics } from '../utils/haptics.js'
import { BASE_URL } from '../utils/api.js'

/**
 * Premium Login viewport with high-fidelity styling parameters
 * matching the visual HTML reference layout.
 */
const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      return toast.error('Please enter both email and password.')
    }

    setSubmitting(true)
    haptics.lightTap()
    try {
      const result = await login(email, password)
      if (result.success) {
        haptics.success()
        toast.success('Welcome back to Troopp!')
        navigate('/feed')
      }
    } catch (err) {
      haptics.error()
      toast.error(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleLogin = () => {
    haptics.lightTap()
    window.location.href = `${BASE_URL}/auth/google`
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
        .login-card {
          background: #1a2129;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.03) inset;
          overflow: hidden;
        }
        .login-header {
          background: linear-gradient(160deg, #1c2a2a 0%, #1a2129 100%);
          padding: 40px 40px 28px;
          text-align: center;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .login-body {
          padding: 32px 40px 40px;
        }
        .login-input {
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
        .login-input:focus {
          border-color: #ff6a2c;
          box-shadow: 0 0 0 3px rgba(255,106,44,0.20);
        }
        .btn-google:hover {
          border-color: rgba(255,255,255,0.25) !important;
          background: #252f39 !important;
        }
        @media (max-width: 480px) {
          .login-header {
            padding: 28px 24px 20px;
          }
          .login-body {
            padding: 24px 24px 28px;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="login-card"
      >
        {/* CARD HEADER */}
        <div className="login-header">
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
            margin: '0 auto 16px'
          }}>T</div>
          <h2 style={{
            fontFamily: 'Space Grotesk',
            fontSize: '26px',
            fontWeight: '700',
            color: '#f3f1ea',
            letterSpacing: '-0.02em',
            marginBottom: '6px'
          }}>Troopp</h2>
          <p style={{ fontSize: '14px', color: '#9ba6ad' }}>
            Welcome back, explorer
          </p>
        </div>

        {/* CARD BODY */}
        <div className="login-body">
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
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
                  placeholder="name@email.com"
                  className="login-input"
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

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <label style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#9ba6ad',
                  display: 'block'
                }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  onClick={() => haptics.lightTap()}
                  style={{ fontSize: '13px', color: '#ff6a2c', fontWeight: '500' }}
                >
                  Forgot?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="login-input"
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    haptics.lightTap()
                    setShowPassword(!showPassword)
                  }}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#6b757c',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Login Action Submit Button */}
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
              {submitting ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          {/* Separator block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flexGrow: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '12px', color: '#6b757c', whiteSpace: 'nowrap' }}>
              or continue with
            </span>
            <div style={{ flexGrow: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Google SSO OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="btn-google"
            style={{
              width: '100%',
              height: '52px',
              background: 'var(--surface-raised)',
              border: '1px solid var(--border-strong)',
              borderRadius: '100px',
              color: 'var(--text-primary)',
              fontSize: '14.5px',
              fontWeight: '500',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'border-color 150ms ease, background 150ms ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Footer Link redirect */}
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#9ba6ad' }}>
            New to Troopp?{' '}
            <Link
              to="/signup"
              onClick={() => haptics.lightTap()}
              style={{ color: '#ff6a2c', fontWeight: '600' }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login
export { Login }
