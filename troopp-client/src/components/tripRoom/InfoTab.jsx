import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '../common/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { haptics } from '../../utils/haptics.js'

// Local NumberTicker component for member counts
const NumberTicker = ({ value, duration = 400 }) => {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)
  
  useEffect(() => {
    let start = prevValueRef.current
    const end = value
    if (start === end) return
    
    const startTime = performance.now()
    let frameId
    
    const update = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = progress * (2 - progress) // Ease out quad
      const current = Math.round(start + (end - start) * easeProgress)
      setDisplayValue(current)
      
      if (progress < 1) {
        frameId = requestAnimationFrame(update)
      } else {
        setDisplayValue(end)
        prevValueRef.current = end
      }
    }
    
    frameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frameId)
  }, [value, duration])

  useEffect(() => {
    prevValueRef.current = value
  }, [value])
  
  return <span>{displayValue}</span>
}

// Interactive Waypoint Row component with check-in confirmation details
const WaypointRow = ({ point, onCheckIn, user }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [justConfirmed, setJustConfirmed] = useState(false)
  const prevConfirmedLen = useRef(point.confirmed.length)

  const isAllConfirmed = point.pending.length === 0
  const userName = user?.name || 'Explorer'
  const canCheckIn = point.pending.includes(userName)

  useEffect(() => {
    if (point.confirmed.length > prevConfirmedLen.current) {
      setJustConfirmed(true)
      haptics.waypointCheckin()
      const timer = setTimeout(() => setJustConfirmed(false), 2000)
      return () => clearTimeout(timer)
    }
    prevConfirmedLen.current = point.confirmed.length
  }, [point.confirmed])

  return (
    <div
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        border: isAllConfirmed
          ? '1px solid #4fbe8e'
          : isOpen
          ? '1px solid rgba(255,255,255,0.14)'
          : '1px solid rgba(255,255,255,0.08)',
        background: isAllConfirmed
          ? 'rgba(79,190,142,0.06)'
          : isOpen
          ? '#212b33'
          : '#1a2129',
        boxShadow: isAllConfirmed ? '0 0 12px rgba(79,190,142,0.15)' : 'none'
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '700',
          color: '#f3f1ea',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {/* Status Dot with pulse scale */}
          <motion.span
            animate={justConfirmed ? { scale: [1, 1.6, 1], rotate: [0, 15, -15, 0] } : {}}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              flexShrink: 0,
              transition: 'background-color 300ms ease',
              background: isAllConfirmed ? '#4fbe8e' : '#6b757c',
              boxShadow: isAllConfirmed ? '0 0 8px rgba(79,190,142,0.6)' : 'none'
            }}
          />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {point.label}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#9ba6ad', fontWeight: '500', marginLeft: '8px', whiteSpace: 'nowrap' }}>
          {point.time}
        </span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: '#161d24',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '11.5px',
              color: '#9ba6ad',
              overflow: 'hidden'
            }}
          >
            {/* Confirmed list */}
            <div>
              <strong style={{ color: '#4fbe8e', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px' }}>
                ✓ Checked-In:
              </strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {point.confirmed.length > 0 ? (
                  point.confirmed.map((name) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, scale: 0.75, x: -10 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(79,190,142,0.14)',
                        color: '#4fbe8e',
                        padding: '3px 10px',
                        borderRadius: '100px',
                        fontWeight: '700',
                        fontSize: '11px'
                      }}
                    >
                      <span>👤 {name}</span>
                    </motion.div>
                  ))
                ) : (
                  <span style={{ fontStyle: 'italic', color: '#6b757c' }}>None yet</span>
                )}
              </div>
            </div>

            {/* Pending list */}
            <div>
              <strong style={{ color: '#ffc94d', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px' }}>
                ⏳ Pending:
              </strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {point.pending.length > 0 ? (
                  point.pending.map((name) => (
                    <span
                      key={name}
                      style={{
                        background: '#212b33',
                        color: '#9ba6ad',
                        padding: '3px 10px',
                        borderRadius: '100px',
                        fontWeight: '600',
                        fontSize: '11px'
                      }}
                    >
                      {name}
                    </span>
                  ))
                ) : (
                  <span style={{ color: '#4fbe8e', fontWeight: '700' }}>All Checked In! 🎉</span>
                )}
              </div>
            </div>

            {/* Check In Action Button */}
            {canCheckIn && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCheckIn(point.id)
                }}
                style={{
                  marginTop: '4px',
                  width: '100%',
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                  color: '#1a0e08',
                  borderRadius: '100px',
                  fontWeight: '700',
                  fontSize: '11px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(255,106,44,0.2)'
                }}
              >
                Check In Here
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Shared waypoints map and travelers checklist metadata.
 */
const InfoTab = ({
  activity,
  members = [],
  onMemberTap
}) => {
  const [sharing, setSharing] = useState(false)
  const { user } = useAuth()
  
  // Local Waypoints checkpoints data list
  const [localWaypoints, setLocalWaypoints] = useState([
    { id: 1, label: 'Start Point Meeting', time: '06:00 AM', confirmed: ['Amit', 'Priya'], pending: ['Vikram'] },
    { id: 2, label: 'Midway Halt Breakfast', time: '09:30 AM', confirmed: ['Amit'], pending: ['Priya', 'Vikram'] },
    { id: 3, label: 'Summit Base Camp', time: '02:00 PM', confirmed: [], pending: ['Amit', 'Priya', 'Vikram'] }
  ])

  // Simulation parameters for location coordinates sharing
  useEffect(() => {
    let interval
    if (sharing) {
      interval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            console.log(`[LIVE SHARE] Latitude: ${pos.coords.latitude}, Longitude: ${pos.coords.longitude}`)
          })
        }
      }, 30000) // Broadcast every 30 seconds
    }
    return () => clearInterval(interval)
  }, [sharing])

  const meetingLabel = activity.meeting_point_label || 'Mumbai Central Railway Station'
  const hostName = activity.Creator?.Profile?.name || 'Group Host'

  const handleCheckIn = (waypointId) => {
    const userName = user?.name || 'Explorer'
    setLocalWaypoints((prev) =>
      prev.map((pt) => {
        if (pt.id !== waypointId) return pt
        if (pt.confirmed.includes(userName)) return pt
        return {
          ...pt,
          confirmed: [...pt.confirmed, userName],
          pending: pt.pending.filter((name) => name !== userName)
        }
      })
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#f3f1ea' }}>
      {/* 1. Google Maps Static/Interactive Frame Mock */}
      <div
        style={{
          width: '100%',
          height: '160px',
          background: '#1a2129',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'end',
          padding: '14px',
          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.2)'
        }}
      >
        {/* Placeholder SVG background representing route map */}
        <div style={{ position: 'absolute', inset: 0, background: '#1a2129', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b757c', fontWeight: '600', fontSize: '12px' }}>
          🗺️ Google Map: [Lat: {activity.meeting_point_lat || 19.07}, Lng: {activity.meeting_point_lng || 72.87}]
        </div>
        <div style={{ background: 'rgba(12,16,19,0.85)', backdropFilter: 'blur(6px)', padding: '8px 14px', borderRadius: '12px', zIndex: 10, display: 'flex', flexDirection: 'column', color: 'white', maxWidth: '85%', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '9px', fontWeight: '700', uppercase: 'true', letterSpacing: '0.05em', color: '#ff6a2c' }}>Meeting Point</span>
          <span style={{ fontSize: '11px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{meetingLabel}</span>
        </div>
      </div>

      {/* 2. Destination Details Card */}
      <div
        style={{
          background: '#1a2129',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Destination Location</span>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f3f1ea', lineHeight: 1.2, fontFamily: 'Space Grotesk' }}>
          {activity.destination || 'Harishchandragad Peak'}
        </h3>
        <p style={{ fontSize: '13px', color: '#9ba6ad', lineHeight: 1.5, marginTop: '4px' }}>
          📅 Scheduled on: {new Date(activity.date_time || '2026-07-15T06:00:00Z').toLocaleString()} <br />
          💰 Estimated Budget: ₹{activity.cost_per_person || 0} per person
        </p>
      </div>

      {/* 3. Host Profile Card */}
      <div
        style={{
          background: '#1a2129',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'between',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <Avatar size="md" score={85} name={hostName} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#ff6a2c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Group Leader</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#f3f1ea' }}>
              {hostName}
            </span>
            <span style={{ fontSize: '11px', color: '#9ba6ad', marginTop: '2px' }}>Host Rating: 98% · Trust: 85</span>
          </div>
        </div>
        <button
          style={{
            height: '32px',
            padding: '0 14px',
            border: '1px solid rgba(255,255,255,0.14)',
            background: '#212b33',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: '700',
            color: '#f3f1ea',
            cursor: 'pointer',
            transition: 'background-color 150ms'
          }}
          onClick={() => onMemberTap && onMemberTap({ name: hostName, isHost: true })}
        >
          Profile
        </button>
      </div>

      {/* 4. Horizontal Confirmed Members Scroll bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Confirmed Members (<NumberTicker value={members.length} />)
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', overflowX: 'auto', paddingBottom: '6px' }}>
          <AnimatePresence>
            {members.map((m) => (
              <motion.div
                key={m.userId || m.id}
                onClick={() => onMemberTap && onMemberTap(m)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0, originCenter: 'true' }}
              >
                <Avatar src={m.avatarUrl || m.User?.Profile?.avatar_url} name={m.name || m.User?.Profile?.name || 'Explorer'} size="sm" score={m.trustScore || m.User?.trust_score || 80} />
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#9ba6ad', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '64px', textAlign: 'center' }}>
                  {(m.name || m.User?.Profile?.name || 'Explorer').split(' ')[0]}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 5. Live Location Share Toggle */}
      <div
        style={{
          padding: '16px',
          background: '#1a2129',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '75%' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#f3f1ea' }}>Live Location Share</span>
          <span style={{ fontSize: '11px', color: '#9ba6ad', lineHeight: 1.4 }}>
            Broadcasts your GPS coordinates to other members every 5 minutes.
          </span>
        </div>
        <label style={{ position: 'relative', inlineFlex: 'true', alignItems: 'center', cursor: 'pointer', width: '44px', height: '24px' }}>
          <input
            type="checkbox"
            checked={sharing}
            onChange={(e) => setSharing(e.target.checked)}
            style={{ display: 'none' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '100px',
              background: sharing ? '#ff6a2c' : '#212b33',
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'background-color 200ms ease'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '3px',
              left: sharing ? 'calc(100% - 21px)' : '3px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              transition: 'left 200ms ease'
            }}
          />
        </label>
      </div>

      {/* 6. Waypoints Checkpoints list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Check-in Waypoints Status
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {localWaypoints.map((point) => (
            <WaypointRow
              key={point.id}
              point={point}
              onCheckIn={handleCheckIn}
              user={user}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default InfoTab
export { InfoTab }

