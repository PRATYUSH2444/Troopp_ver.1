import React, { useState } from 'react'
import { BaseModal } from '../common/Modal.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import { haptics } from '../../utils/haptics.js'

export const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    haptics.lightTap()
    setError(null)
    setLoading(true)

    try {
      if (isSignUp) {
        // Sign up logic calls api directly
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
        const res = await fetch(`${apiUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Registration failed')
        
        // After registration, log them in
        await login(email, password)
      } else {
        await login(email, password)
      }
      
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    haptics.impactLight()
    setIsSignUp(!isSignUp)
    setError(null)
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isSignUp ? 'Join Troopp' : 'Welcome Back'} size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', marginTop: '8px' }}>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
          {isSignUp
            ? 'Create a Troopp profile to join communities, share trips, and rate travelers.'
            : 'Log in to continue voting, commenting, and bookmarking travel reports.'}
        </p>

        {error && (
          <div style={{ padding: '12px', background: 'var(--color-danger-bg)', border: '1px solid rgba(255,84,112,0.2)', borderRadius: '12px', fontSize: '12px', color: 'var(--danger)', textAlign: 'left' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          {isSignUp && (
            <Input
              label="Full Name"
              type="text"
              required
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          )}

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="explorer@troopp.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '12px',
              border: 'none',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              marginTop: '12px',
              boxShadow: '0 4px 14px rgba(255,106,44,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isSignUp ? 'Create Account' : 'Log In'}
          </Button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
          <button
            type="button"
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontWeight: '600',
              padding: 0,
              fontSize: '13px',
              outline: 'none'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </BaseModal>
  )
}

export default AuthModal
