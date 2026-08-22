import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { haptics } from '../utils/haptics.js'
import { apiRequest } from '../utils/api.js'

/**
 * Premium Settings Panel conforming to Section 3.7 specifications.
 */
const Settings = () => {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fetchProfile = async () => {
      try {
        const res = await apiRequest('/profiles/me')
        if (res.ok && active) {
          const json = await res.json()
          setProfileData(json.data)
        }
      } catch (err) {
        console.error('Failed to load settings profile:', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchProfile()
    return () => {
      active = false
    }
  }, [])

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('troopp_sounds_enabled') === 'true'
  })
  
  const [hoveredRowId, setHoveredRowId] = useState(null)
  const [isBackHovered, setIsBackHovered] = useState(false)
  const [isSignoutHovered, setIsSignoutHovered] = useState(false)

  const handleToggleSounds = () => {
    haptics.lightTap()
    const newVal = !soundEnabled
    setSoundEnabled(newVal)
    localStorage.setItem('troopp_sounds_enabled', newVal ? 'true' : 'false')
    toast.success(newVal ? 'Sound effects enabled!' : 'Sound effects muted.')
    if (newVal) {
      import('../utils/sounds.js').then((m) => m.playSuccess())
    }
  }

  const handleLogout = async () => {
    haptics.lightTap()
    try {
      await logout()
      toast.success('Successfully logged out.')
      navigate('/login')
    } catch (err) {
      toast.error('Logout failed.')
    }
  }

  return (
    <div className="page-container-narrow select-none">
      {/* Back Link Header */}
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
          <button
            onClick={() => {
              haptics.lightTap()
              navigate('/profile/me')
            }}
            onMouseEnter={() => setIsBackHovered(true)}
            onMouseLeave={() => setIsBackHovered(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: isBackHovered ? '#f3f1ea' : '#9ba6ad',
              fontSize: '14px',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
              alignSelf: 'flex-start',
              transition: 'color 150ms ease'
            }}
          >
            ← Back
          </button>
          
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: '700',
              color: '#f3f1ea',
              marginTop: '12px',
              marginBottom: '6px',
              letterSpacing: '-0.01em',
              lineHeight: 1.2
            }}
          >
            Account Settings
          </h1>
          <p style={{ fontSize: '14px', color: '#9ba6ad', margin: 0 }}>
            Manage your Troopp account
          </p>
        </div>

        {/* SECTION: ACCOUNT */}
        <div
          style={{
            background: '#1a2129',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}
        >
          <div style={{ padding: '11px 18px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b757c' }}>
              Account
            </span>
          </div>
          
          <Link
            to="/profile/me/edit"
            onClick={() => haptics.lightTap()}
            onMouseEnter={() => setHoveredRowId('edit-profile')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 150ms ease',
              textDecoration: 'none',
              background: hoveredRowId === 'edit-profile' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <svg style={{ width: '20px', height: '20px', color: '#9ba6ad', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea', flex: 1 }}>
              Edit Public Profile
            </span>
            <svg style={{ width: '16px', height: '16px', color: '#6b757c', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            to="/profile/me/emergency"
            onClick={() => haptics.lightTap()}
            onMouseEnter={() => setHoveredRowId('emergency-contacts')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 150ms ease',
              textDecoration: 'none',
              background: hoveredRowId === 'emergency-contacts' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <svg style={{ width: '20px', height: '20px', color: '#9ba6ad', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea', flex: 1 }}>
              Manage Emergency Contacts
            </span>
            <svg style={{ width: '16px', height: '16px', color: '#6b757c', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            to="/profile/me/settings/notifications"
            onClick={() => haptics.lightTap()}
            onMouseEnter={() => setHoveredRowId('notif-prefs')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              transition: 'background 150ms ease',
              textDecoration: 'none',
              background: hoveredRowId === 'notif-prefs' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <svg style={{ width: '20px', height: '20px', color: '#9ba6ad', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea', flex: 1 }}>
              Push Notifications Preferences
            </span>
            <svg style={{ width: '16px', height: '16px', color: '#6b757c', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* SECTION: VERIFICATION & SECURITY */}
        <div
          style={{
            background: '#1a2129',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}
        >
          <div style={{ padding: '11px 18px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b757c' }}>
              🛡️ Verification & Security
            </span>
          </div>

          <div
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <svg style={{ width: '20px', height: '20px', color: '#9ba6ad' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>Email Address</span>
                <span style={{ fontSize: '11px', color: '#6b757c' }}>{user?.email}</span>
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '100px' }}>
              ✓ Verified via Google
            </span>
          </div>

          <div
            onMouseEnter={() => setHoveredRowId('verify-phone-row')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: hoveredRowId === 'verify-phone-row' ? 'rgba(255,255,255,0.03)' : 'transparent',
              transition: 'background 150ms ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <svg style={{ width: '20px', height: '20px', color: '#9ba6ad' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>Mobile Number</span>
                <span style={{ fontSize: '11px', color: '#6b757c' }}>
                  {profileData?.isPhoneVerified ? (profileData?.profile?.phone || 'Verified') : 'Not verified yet'}
                </span>
              </div>
            </div>
            
            {profileData?.isPhoneVerified ? (
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '100px' }}>
                ✓ Verified via SMS
              </span>
            ) : (
              <button
                onClick={() => {
                  haptics.lightTap()
                  navigate('/profile/me/verify-phone')
                }}
                style={{
                  background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                  border: 'none',
                  color: '#1a0e08',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '6px 14px',
                  borderRadius: '100px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255,106,44,0.2)'
                }}
              >
                Verify Now
              </button>
            )}
          </div>
        </div>

        {/* SECTION: PREFERENCES */}
        <div
          style={{
            background: '#1a2129',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}
        >
          <div style={{ padding: '11px 18px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b757c' }}>
              Preferences
            </span>
          </div>

          <div
            onClick={handleToggleSounds}
            onMouseEnter={() => setHoveredRowId('sounds')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              transition: 'background 150ms ease',
              background: hoveredRowId === 'sounds' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <svg style={{ width: '20px', height: '20px', color: '#9ba6ad', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea', flex: 1 }}>
              Programmatic Sound Effects
            </span>
            
            {/* Custom Toggle Switch */}
            <div
              style={{
                width: '44px',
                height: '24px',
                position: 'relative',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {/* Toggle Track */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '100px',
                  background: soundEnabled ? '#ff6a2c' : '#212b33',
                  border: '1px solid rgba(255,255,255,0.08)',
                  transition: 'background 200ms ease'
                }}
              />
              {/* Toggle Thumb */}
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: soundEnabled ? 'calc(100% - 22px)' : '2px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.30)',
                  transition: 'left 200ms ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* SECTION: LEGAL */}
        <div
          style={{
            background: '#1a2129',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '16px'
          }}
        >
          <div style={{ padding: '11px 18px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b757c' }}>
              Legal
            </span>
          </div>

          <Link
            to="/terms"
            target="_blank"
            onClick={() => haptics.lightTap()}
            onMouseEnter={() => setHoveredRowId('terms')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 150ms ease',
              textDecoration: 'none',
              background: hoveredRowId === 'terms' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <svg style={{ width: '20px', height: '20px', color: '#9ba6ad', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea', flex: 1 }}>
              Terms of Service
            </span>
            <svg style={{ width: '16px', height: '16px', color: '#6b757c', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            to="/privacy"
            target="_blank"
            onClick={() => haptics.lightTap()}
            onMouseEnter={() => setHoveredRowId('privacy')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              transition: 'background 150ms ease',
              textDecoration: 'none',
              background: hoveredRowId === 'privacy' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <svg style={{ width: '20px', height: '20px', color: '#9ba6ad', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea', flex: 1 }}>
              Privacy Policy
            </span>
            <svg style={{ width: '16px', height: '16px', color: '#6b757c', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          onMouseEnter={() => setIsSignoutHovered(true)}
          onMouseLeave={() => setIsSignoutHovered(false)}
          style={{
            width: '100%',
            height: '48px',
            background: isSignoutHovered ? 'rgba(255, 84, 112, 0.12)' : 'transparent',
            border: '1px solid',
            borderColor: isSignoutHovered ? '#ff5470' : 'rgba(255, 84, 112, 0.28)',
            color: '#ff5470',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            textAlign: 'center',
            marginTop: '24px',
            transition: 'background 150ms ease, border-color 150ms ease'
          }}
        >
          Sign out
        </button>

      </div>
  )
}

export default Settings
export { Settings }
