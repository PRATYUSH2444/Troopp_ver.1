import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import Spinner from '../components/common/Spinner.jsx'
import { haptics } from '../utils/haptics.js'

const SetupActivity = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [isBackHovered, setIsBackHovered] = useState(false)
  const [isAddHovered, setIsAddHovered] = useState(false)
  const [isSubmitHovered, setIsSubmitHovered] = useState(false)

  // Setup properties states
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [rules, setRules] = useState({
    no_smoking: false,
    pets_allowed: false,
    alcohol_allowed: false,
    music_allowed: false
  })
  const [waypoints, setWaypoints] = useState([
    { label: 'Start Point', latitude: 19.6175, longitude: 73.7845, radius_meters: 100 }
  ])

  useEffect(() => {
    const loadDetails = async () => {
      try {
        if (!id || id === 'undefined') {
          toast.error('Invalid or missing trip ID. Redirecting to feed...')
          setTimeout(() => {
            navigate('/feed')
          }, 2500)
          setWelcomeMessage('Welcome to our upcoming outdoor adventure trek!')
          setLoading(false)
          return
        }
        const res = await apiRequest(`/activities/${id}`)
        if (res.ok) {
          const json = await res.json()
          const act = json.data
          setWelcomeMessage(act.welcome_message || '')
          if (act.rules) setRules(act.rules)
          if (act.Waypoints?.length > 0) {
            setWaypoints(act.Waypoints.map((w) => ({
              label: w.label,
              latitude: parseFloat(w.latitude) || 0,
              longitude: parseFloat(w.longitude) || 0,
              radius_meters: parseInt(w.radius_meters) || 100
            })))
          }
        }
      } catch (err) {
        toast.error('Failed to load activity details.')
      } finally {
        setLoading(false)
      }
    }
    loadDetails()
  }, [id])

  const handleRuleToggle = (name) => {
    haptics.lightTap()
    setRules((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const handleWaypointChange = (index, field, value) => {
    setWaypoints((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addWaypoint = () => {
    haptics.lightTap()
    setWaypoints((prev) => [
      ...prev,
      { label: `Checkpoint ${prev.length + 1}`, latitude: 19.6175, longitude: 73.7845, radius_meters: 100 }
    ])
  }

  const removeWaypoint = (index) => {
    haptics.lightTap()
    setWaypoints((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleSaveSetup = async (e) => {
    e.preventDefault()
    if (!id || id === 'undefined') {
      toast.error('Cannot save configuration: missing trip ID.')
      navigate('/feed')
      return
    }
    setSaving(true)
    haptics.lightTap()

    try {
      // 1. Save rules
      const rulesRes = await apiRequest(`/activities/${id}/setup/rules`, {
        method: 'POST',
        body: JSON.stringify(rules)
      })
      if (!rulesRes.ok) throw new Error('Failed to save safety rules.')

      // 2. Save welcome message
      const welcomeRes = await apiRequest(`/activities/${id}/setup/welcome-message`, {
        method: 'POST',
        body: JSON.stringify({ message_text: welcomeMessage })
      })
      if (!welcomeRes.ok) throw new Error('Failed to save welcome banner.')

      // 3. Save waypoints coordinates
      const waypointsRes = await apiRequest(`/activities/${id}/setup/waypoints`, {
        method: 'POST',
        body: JSON.stringify({ waypoints })
      })
      if (!waypointsRes.ok) throw new Error('Failed to save geofence waypoints.')

      haptics.success()
      toast.success('Trip parameters successfully configured!')
      navigate(`/activities/${id}`)
    } catch (err) {
      haptics.error()
      toast.error(err.message || 'Failed to complete setup configuration.')
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

  const backTarget = id && id !== 'undefined' ? `/activities/${id}` : '/feed'

  return (
    <div className="page-container-narrow select-none">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', userSelect: 'none' }}>
          <button
            onClick={() => {
              haptics.lightTap()
              navigate(backTarget)
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
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: '700',
                color: '#f3f1ea',
                margin: 0,
                letterSpacing: '-0.015em'
              }}
            >
              Configure Trip Setup
            </h2>
            <span style={{ fontSize: '10px', color: '#6b757c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Establish waypoint geofences and safety rules
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveSetup} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Welcome Announcement Message */}
          <div
            style={{
              background: '#1a2129',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#6b757c', margin: 0, letterSpacing: '0.04em' }}>
              💬 Trip Welcome Message
            </h3>
            <p style={{ fontSize: '11px', color: '#9ba6ad', margin: 0 }}>
              Broadcasted as a system banner when members enter the room
            </p>
            <textarea
              rows={3}
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Welcome explorers! Please wear sturdy trekking boots and pack 2L water minimum..."
              style={{
                width: '100%',
                background: '#212b33',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '14px',
                color: '#f3f1ea',
                outline: 'none',
                resize: 'none',
                lineHeight: '1.5'
              }}
              required
            />
          </div>

          {/* Safety Rules */}
          <div
            style={{
              background: '#1a2129',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              userSelect: 'none'
            }}
          >
            <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#6b757c', margin: 0, letterSpacing: '0.04em' }}>
              🔒 Safety Rules Selection
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {Object.keys(rules).map((ruleKey) => {
                const isActive = rules[ruleKey]
                return (
                  <button
                    key={ruleKey}
                    type="button"
                    onClick={() => handleRuleToggle(ruleKey)}
                    style={{
                      height: '46px',
                      padding: '0 16px',
                      borderRadius: '12px',
                      border: 'none',
                      background: isActive ? 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)' : '#212b33',
                      color: isActive ? '#1a0e08' : '#9ba6ad',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: isActive ? '0 4px 12px rgba(255,106,44,0.25)' : 'none',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <span style={{ textTransform: 'capitalize' }}>{ruleKey.replace('_', ' ')}</span>
                    <span>{isActive ? '✓' : '+'}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Waypoints geofences coordinates list */}
          <div
            style={{
              background: '#1a2129',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '14px',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#6b757c', margin: 0, letterSpacing: '0.04em' }}>
                🗺️ Waypoint Geofences
              </h3>
              <button
                type="button"
                onClick={addWaypoint}
                onMouseEnter={() => setIsAddHovered(true)}
                onMouseLeave={() => setIsAddHovered(false)}
                style={{
                  padding: '6px 14px',
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: isAddHovered ? '#ff6a2c' : '#f3f1ea',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  borderRadius: '100px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease'
                }}
              >
                Add Waypoint +
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {waypoints.map((wp, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    position: 'relative'
                  }}
                >
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => removeWaypoint(idx)}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: '#ff5470',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* Waypoint Label */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#9ba6ad', userSelect: 'none' }}>
                        Waypoint Label
                      </label>
                      <input
                        type="text"
                        value={wp.label}
                        onChange={(e) => handleWaypointChange(idx, 'label', e.target.value)}
                        placeholder="Start / Checkpoint"
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 12px',
                          background: '#1a2129',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '100px',
                          fontSize: '13px',
                          color: '#f3f1ea',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>

                    {/* Radius */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#9ba6ad', userSelect: 'none' }}>
                        Radius (meters)
                      </label>
                      <input
                        type="number"
                        value={wp.radius_meters}
                        onChange={(e) => handleWaypointChange(idx, 'radius_meters', parseInt(e.target.value) || 100)}
                        placeholder="100"
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 12px',
                          background: '#1a2129',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '100px',
                          fontSize: '13px',
                          color: '#f3f1ea',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>

                    {/* Latitude */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#9ba6ad', userSelect: 'none' }}>
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={wp.latitude}
                        onChange={(e) => handleWaypointChange(idx, 'latitude', parseFloat(e.target.value) || 0)}
                        placeholder="19.6175"
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 12px',
                          background: '#1a2129',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '100px',
                          fontSize: '13px',
                          color: '#f3f1ea',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>

                    {/* Longitude */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#9ba6ad', userSelect: 'none' }}>
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={wp.longitude}
                        onChange={(e) => handleWaypointChange(idx, 'longitude', parseFloat(e.target.value) || 0)}
                        placeholder="73.7845"
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 12px',
                          background: '#1a2129',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '100px',
                          fontSize: '13px',
                          color: '#f3f1ea',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            onMouseEnter={() => setIsSubmitHovered(true)}
            onMouseLeave={() => setIsSubmitHovered(false)}
            style={{
              width: '100%',
              height: '48px',
              background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
              color: '#1a0e08',
              border: 'none',
              borderRadius: '100px',
              fontSize: '14px',
              fontWeight: '700',
              fontFamily: 'Space Grotesk, sans-serif',
              cursor: 'pointer',
              boxShadow: isSubmitHovered ? '0 8px 24px rgba(255,106,44,0.35)' : '0 6px 18px rgba(255,106,44,0.20)',
              transform: isSubmitHovered ? 'translateY(-1px)' : 'translateY(0)',
              transition: 'all 150ms ease',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Configuring Setup Parameters...' : 'Complete & Save Trip Configuration'}
          </button>
        </form>

      </div>
  )
}

export default SetupActivity
export { SetupActivity }
