import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { haptics } from '../utils/haptics.js'

/**
 * Premium Notification Preferences page conforming to Section 3.7 specifications.
 */
const NotificationSettings = () => {
  const navigate = useNavigate()
  
  const [isBackHovered, setIsBackHovered] = useState(false)
  const [isSaveHovered, setIsSaveHovered] = useState(false)
  const [hoveredRowId, setHoveredRowId] = useState(null)

  // Local Toggle States
  const [prefs, setPrefs] = useState({
    joinRequests: true,
    tripApprovals: true,
    chatMessages: true,
    newTripsNearby: false,
    followerUpdates: true,
    trustScoreChanges: true,
    securityAlerts: true
  })

  const handleToggle = (key) => {
    haptics.lightTap()
    setPrefs(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = () => {
    haptics.success()
    toast.success('Notification preferences updated!')
    navigate(-1)
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#10151a', padding: '28px 40px 80px' }}>
      <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
        
        {/* Back Link Header */}
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
          <button
            onClick={() => {
              haptics.lightTap()
              navigate(-1)
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
            Notification Preferences
          </h1>
          <p style={{ fontSize: '14px', color: '#9ba6ad', margin: 0 }}>
            Choose what alerts you want to receive
          </p>
        </div>

        {/* SECTION: TRIP ACTIVITY */}
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
              Trip Activity
            </span>
          </div>

          {/* Row: Join Requests */}
          <div
            onClick={() => handleToggle('joinRequests')}
            onMouseEnter={() => setHoveredRowId('join')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 150ms ease',
              background: hoveredRowId === 'join' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🎒</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>Join Requests</span>
              <span style={{ fontSize: '12px', color: '#9ba6ad', marginTop: '2px' }}>When travelers request to join your trips</span>
            </div>
            {/* Toggle Switch */}
            <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: prefs.joinRequests ? '#ff6a2c' : '#212b33', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 200ms ease' }} />
              <div style={{ position: 'absolute', top: '2px', left: prefs.joinRequests ? 'calc(100% - 22px)' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.30)', transition: 'left 200ms ease' }} />
            </div>
          </div>

          {/* Row: Trip Approvals */}
          <div
            onClick={() => handleToggle('tripApprovals')}
            onMouseEnter={() => setHoveredRowId('approval')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 150ms ease',
              background: hoveredRowId === 'approval' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🎉</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>Trip Approvals</span>
              <span style={{ fontSize: '12px', color: '#9ba6ad', marginTop: '2px' }}>When hosts approve your request to join</span>
            </div>
            {/* Toggle Switch */}
            <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: prefs.tripApprovals ? '#ff6a2c' : '#212b33', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 200ms ease' }} />
              <div style={{ position: 'absolute', top: '2px', left: prefs.tripApprovals ? 'calc(100% - 22px)' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.30)', transition: 'left 200ms ease' }} />
            </div>
          </div>

          {/* Row: Chat Messages */}
          <div
            onClick={() => handleToggle('chatMessages')}
            onMouseEnter={() => setHoveredRowId('chat')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              transition: 'background 150ms ease',
              background: hoveredRowId === 'chat' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>💬</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>Chat Messages</span>
              <span style={{ fontSize: '12px', color: '#9ba6ad', marginTop: '2px' }}>New messages inside trip rooms</span>
            </div>
            {/* Toggle Switch */}
            <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: prefs.chatMessages ? '#ff6a2c' : '#212b33', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 200ms ease' }} />
              <div style={{ position: 'absolute', top: '2px', left: prefs.chatMessages ? 'calc(100% - 22px)' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.30)', transition: 'left 200ms ease' }} />
            </div>
          </div>
        </div>

        {/* SECTION: COMMUNITY */}
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
              Community
            </span>
          </div>

          {/* Row: New Trips Nearby */}
          <div
            onClick={() => handleToggle('newTripsNearby')}
            onMouseEnter={() => setHoveredRowId('nearby')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 150ms ease',
              background: hoveredRowId === 'nearby' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🗺️</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>New Trips Nearby</span>
              <span style={{ fontSize: '12px', color: '#9ba6ad', marginTop: '2px' }}>When trips are created in your home city</span>
            </div>
            {/* Toggle Switch */}
            <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: prefs.newTripsNearby ? '#ff6a2c' : '#212b33', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 200ms ease' }} />
              <div style={{ position: 'absolute', top: '2px', left: prefs.newTripsNearby ? 'calc(100% - 22px)' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.30)', transition: 'left 200ms ease' }} />
            </div>
          </div>

          {/* Row: Follower Updates */}
          <div
            onClick={() => handleToggle('followerUpdates')}
            onMouseEnter={() => setHoveredRowId('followers')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              transition: 'background 150ms ease',
              background: hoveredRowId === 'followers' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>👤</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>Follower Updates</span>
              <span style={{ fontSize: '12px', color: '#9ba6ad', marginTop: '2px' }}>When travelers follow you or post memory walls</span>
            </div>
            {/* Toggle Switch */}
            <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: prefs.followerUpdates ? '#ff6a2c' : '#212b33', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 200ms ease' }} />
              <div style={{ position: 'absolute', top: '2px', left: prefs.followerUpdates ? 'calc(100% - 22px)' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.30)', transition: 'left 200ms ease' }} />
            </div>
          </div>
        </div>

        {/* SECTION: TRUST & SAFETY */}
        <div
          style={{
            background: '#1a2129',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '24px'
          }}
        >
          <div style={{ padding: '11px 18px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b757c' }}>
              Trust & Safety
            </span>
          </div>

          {/* Row: Trust Score Changes */}
          <div
            onClick={() => handleToggle('trustScoreChanges')}
            onMouseEnter={() => setHoveredRowId('trust')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              transition: 'background 150ms ease',
              background: hoveredRowId === 'trust' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🛡️</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>Trust Score Shifts</span>
              <span style={{ fontSize: '12px', color: '#9ba6ad', marginTop: '2px' }}>Audit alerts regarding trust points updates</span>
            </div>
            {/* Toggle Switch */}
            <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: prefs.trustScoreChanges ? '#ff6a2c' : '#212b33', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 200ms ease' }} />
              <div style={{ position: 'absolute', top: '2px', left: prefs.trustScoreChanges ? 'calc(100% - 22px)' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.30)', transition: 'left 200ms ease' }} />
            </div>
          </div>

          {/* Row: Security Alerts */}
          <div
            onClick={() => handleToggle('securityAlerts')}
            onMouseEnter={() => setHoveredRowId('security')}
            onMouseLeave={() => setHoveredRowId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              transition: 'background 150ms ease',
              background: hoveredRowId === 'security' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🚨</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>Critical Security Alerts</span>
              <span style={{ fontSize: '12px', color: '#9ba6ad', marginTop: '2px' }}>Account access notices and safety warnings</span>
            </div>
            {/* Toggle Switch */}
            <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: prefs.securityAlerts ? '#ff6a2c' : '#212b33', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 200ms ease' }} />
              <div style={{ position: 'absolute', top: '2px', left: prefs.securityAlerts ? 'calc(100% - 22px)' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.30)', transition: 'left 200ms ease' }} />
            </div>
          </div>
        </div>

        {/* Save CTA Trigger */}
        <button
          onClick={handleSave}
          onMouseEnter={() => setIsSaveHovered(true)}
          onMouseLeave={() => setIsSaveHovered(false)}
          style={{
            width: '100%',
            height: '48px',
            background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
            color: '#1a0e08',
            border: 'none',
            borderRadius: '100px',
            fontSize: '15px',
            fontWeight: '700',
            fontFamily: 'Space Grotesk, sans-serif',
            cursor: 'pointer',
            boxShadow: isSaveHovered ? '0 8px 24px rgba(255,106,44,0.35)' : '0 6px 18px rgba(255,106,44,0.20)',
            transform: isSaveHovered ? 'translateY(-1px)' : 'translateY(0)',
            transition: 'all 150ms ease'
          }}
        >
          Save Preferences
        </button>

      </div>
    </div>
  )
}

export default NotificationSettings
