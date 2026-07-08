import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../../components/common/Spinner.jsx'
import { haptics } from '../../utils/haptics.js'

/**
 * Configure user notification toggle settings.
 */
const NotificationPreferencesPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [isBackHovered, setIsBackHovered] = useState(false)
  const [hoveredRowId, setHoveredRowId] = useState(null)

  const [preferences, setPreferences] = useState({
    new_activities: true,
    trip_updates: true,
    join_updates: true,
    score_changes: true,
    social: true,
    safety: true,
    admin_broadcasts: true
  })

  // 1. Fetch preferences on load
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        // Mock fetch: axios.get('/api/v1/notifications/preferences')
        await new Promise((r) => setTimeout(r, 400))
        
        setPreferences({
          new_activities: true,
          trip_updates: true,
          join_updates: true,
          score_changes: true,
          social: false, // Simulated off
          safety: true,
          admin_broadcasts: true
        })
      } catch (err) {
        console.error('Failed fetching notification preferences:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPreferences()
  }, [])

  // 2. Save preference states on change
  const handleToggle = async (key) => {
    if (key === 'safety' || key === 'admin_broadcasts') return // Locked values

    haptics.lightTap()
    const updated = {
      ...preferences,
      [key]: !preferences[key]
    }
    setPreferences(updated)
    setSaving(true)

    try {
      // Mock dispatch: axios.put('/api/v1/notifications/preferences', updated)
      await new Promise((r) => setTimeout(r, 300))
    } catch (err) {
      console.error('Failed saving preference settings:', err)
      // Revert if write fails
      setPreferences(preferences)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#10151a' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#10151a', padding: '28px 24px 80px' }}>
      <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', userSelect: 'none' }}>
        
        {/* Header back navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => {
              haptics.lightTap()
              navigate('/profile/me/settings')
            }}
            onMouseEnter={() => setIsBackHovered(true)}
            onMouseLeave={() => setIsBackHovered(false)}
            style={{
              padding: '8px 16px',
              background: isBackHovered ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.14)',
              color: isBackHovered ? '#f3f1ea' : '#9ba6ad',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            ← Back
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', fontBold: '700', textTransform: 'uppercase', color: '#6b757c', letterSpacing: '0.04em' }}>
              Account preferences
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: '700',
                color: '#f3f1ea',
                margin: 0,
                letterSpacing: '-0.015em'
              }}
            >
              Notifications Toggles
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 4px' }}>
            <span>Alert Channels Settings</span>
            {saving && <span style={{ color: '#ff6a2c' }} className="animate-pulse">Saving changes...</span>}
          </div>

          {/* Toggles list */}
          <div
            style={{
              background: '#1a2129',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            
            {/* New Activities */}
            <div
              onClick={() => handleToggle('new_activities')}
              onMouseEnter={() => setHoveredRowId('new_activities')}
              onMouseLeave={() => setHoveredRowId(null)}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                transition: 'background 150ms ease',
                background: hoveredRowId === 'new_activities' ? 'rgba(255,255,255,0.03)' : 'transparent'
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>New Trips Nearby</span>
                <span style={{ fontSize: '12px', color: '#9ba6ad', lineHeight: '1.4' }}>
                  Receive notifications when new hiking or road trip activities are created in your city.
                </span>
              </div>
              <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: preferences.new_activities ? '#ff6a2c' : '#212b33', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 200ms ease' }} />
                <div style={{ position: 'absolute', top: '2px', left: preferences.new_activities ? 'calc(100% - 22px)' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.30)', transition: 'left 200ms ease' }} />
              </div>
            </div>

            {/* Trip Updates */}
            <div
              onClick={() => handleToggle('trip_updates')}
              onMouseEnter={() => setHoveredRowId('trip_updates')}
              onMouseLeave={() => setHoveredRowId(null)}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                transition: 'background 150ms ease',
                background: hoveredRowId === 'trip_updates' ? 'rgba(255,255,255,0.03)' : 'transparent'
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>Active Trip Updates</span>
                <span style={{ fontSize: '12px', color: '#9ba6ad', lineHeight: '1.4' }}>
                  Receive announcements, rating reminders, and scheduled date extensions for trips you are confirmed on.
                </span>
              </div>
              <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: preferences.trip_updates ? '#ff6a2c' : '#212b33', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 200ms ease' }} />
                <div style={{ position: 'absolute', top: '2px', left: preferences.trip_updates ? 'calc(100% - 22px)' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.30)', transition: 'left 200ms ease' }} />
              </div>
            </div>

            {/* Join Updates */}
            <div
              onClick={() => handleToggle('join_updates')}
              onMouseEnter={() => setHoveredRowId('join_updates')}
              onMouseLeave={() => setHoveredRowId(null)}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                transition: 'background 150ms ease',
                background: hoveredRowId === 'join_updates' ? 'rgba(255,255,255,0.03)' : 'transparent'
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>Join Request Statuses</span>
                <span style={{ fontSize: '12px', color: '#9ba6ad', lineHeight: '1.4' }}>
                  Receive notifications when your request to join is approved, waitlist shifts, or when someone applies to your trips.
                </span>
              </div>
              <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: preferences.join_updates ? '#ff6a2c' : '#212b33', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 200ms ease' }} />
                <div style={{ position: 'absolute', top: '2px', left: preferences.join_updates ? 'calc(100% - 22px)' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.30)', transition: 'left 200ms ease' }} />
              </div>
            </div>

            {/* Score Changes */}
            <div
              onClick={() => handleToggle('score_changes')}
              onMouseEnter={() => setHoveredRowId('score_changes')}
              onMouseLeave={() => setHoveredRowId(null)}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                transition: 'background 150ms ease',
                background: hoveredRowId === 'score_changes' ? 'rgba(255,255,255,0.03)' : 'transparent'
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>Trust Score Alerts</span>
                <span style={{ fontSize: '12px', color: '#9ba6ad', lineHeight: '1.4' }}>
                  Receive alerts when your safety trust score changes or reliability increments after rating co-travelers.
                </span>
              </div>
              <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: preferences.score_changes ? '#ff6a2c' : '#212b33', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 200ms ease' }} />
                <div style={{ position: 'absolute', top: '2px', left: preferences.score_changes ? 'calc(100% - 22px)' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.30)', transition: 'left 200ms ease' }} />
              </div>
            </div>

            {/* Social */}
            <div
              onClick={() => handleToggle('social')}
              onMouseEnter={() => setHoveredRowId('social')}
              onMouseLeave={() => setHoveredRowId(null)}
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                transition: 'background 150ms ease',
                background: hoveredRowId === 'social' ? 'rgba(255,255,255,0.03)' : 'transparent'
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>Social Networking</span>
                <span style={{ fontSize: '12px', color: '#9ba6ad', lineHeight: '1.4' }}>
                  Get notified when other travelers start following you or request connection details.
                </span>
              </div>
              <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: preferences.social ? '#ff6a2c' : '#212b33', border: '1px solid rgba(255,255,255,0.08)', transition: 'background 200ms ease' }} />
                <div style={{ position: 'absolute', top: '2px', left: preferences.social ? 'calc(100% - 22px)' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.30)', transition: 'left 200ms ease' }} />
              </div>
            </div>

            {/* Safety - LOCKED */}
            <div
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                opacity: 0.75
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#ff5470' }}>Safety SOS Alerts</span>
                  <span style={{ fontSize: '8px', fontWeight: '700', px: '6px', py: '2px', background: 'rgba(255,84,112,0.14)', border: '1px solid rgba(255,84,112,0.20)', borderRadius: '4px', color: '#ff5470', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Locked
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#9ba6ad', lineHeight: '1.4' }}>
                  Emergency broadcast coordinates and safety warnings are critical for coordination and cannot be disabled.
                </span>
              </div>
              <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0, opacity: 0.5 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: '#ff6a2c', border: '1px solid rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', top: '2px', left: 'calc(100% - 20px)', width: '18px', height: '18px', borderRadius: '50%', background: 'white' }} />
              </div>
            </div>

            {/* Admin Broadcasts - LOCKED */}
            <div
              style={{
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                opacity: 0.75
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#ff5470' }}>Official System Broadcasts</span>
                  <span style={{ fontSize: '8px', fontWeight: '700', px: '6px', py: '2px', background: 'rgba(255,84,112,0.14)', border: '1px solid rgba(255,84,112,0.20)', borderRadius: '4px', color: '#ff5470', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Locked
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#9ba6ad', lineHeight: '1.4' }}>
                  Official notices and administrative policy updates are essential for service operations and cannot be disabled.
                </span>
              </div>
              <div style={{ width: '44px', height: '24px', position: 'relative', flexShrink: 0, opacity: 0.5 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '100px', background: '#ff6a2c', border: '1px solid rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', top: '2px', left: 'calc(100% - 20px)', width: '18px', height: '18px', borderRadius: '50%', background: 'white' }} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationPreferencesPage
export { NotificationPreferencesPage }
