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
const WaypointRow = ({ point = {}, onCheckIn, user }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [justConfirmed, setJustConfirmed] = useState(false)
  const confirmedList = Array.isArray(point?.confirmed) ? point.confirmed : []
  const pendingList = Array.isArray(point?.pending) ? point.pending : []
  const prevConfirmedLen = useRef(confirmedList.length)

  const isAllConfirmed = pendingList.length === 0
  const userName = user?.name || 'Explorer'
  const canCheckIn = pendingList.includes(userName)

  useEffect(() => {
    if (confirmedList.length > prevConfirmedLen.current) {
      setJustConfirmed(true)
      haptics.waypointCheckin()
      const timer = setTimeout(() => setJustConfirmed(false), 2000)
      return () => clearTimeout(timer)
    }
    prevConfirmedLen.current = confirmedList.length
  }, [confirmedList])

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
            {point?.label || 'Checkpoint'}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#9ba6ad', fontWeight: '500', marginLeft: '8px', whiteSpace: 'nowrap' }}>
          {point?.time || ''}
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
                {confirmedList.length > 0 ? (
                  confirmedList.map((item, idx) => {
                    const nameStr = typeof item === 'object' ? item?.name || item?.userName || 'Member' : String(item || 'Member')
                    return (
                      <motion.div
                        key={`${nameStr}-${idx}`}
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
                        <span>👤 {nameStr}</span>
                      </motion.div>
                    )
                  })
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
                {pendingList.length > 0 ? (
                  pendingList.map((item, idx) => {
                    const nameStr = typeof item === 'object' ? item?.name || item?.userName || 'Member' : String(item || 'Member')
                    return (
                      <span
                        key={`${nameStr}-${idx}`}
                        style={{
                          background: '#212b33',
                          color: '#9ba6ad',
                          padding: '3px 10px',
                          borderRadius: '100px',
                          fontWeight: '600',
                          fontSize: '11px'
                        }}
                      >
                        {nameStr}
                      </span>
                    )
                  })
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
  
  const safeMembers = Array.isArray(members) ? members : []

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

  const meetingLabel = activity?.meeting_point_label || 'Mumbai Central Railway Station'
  const hostName = activity?.Creator?.Profile?.name || 'Group Host'

  const handleCheckIn = (waypointId) => {
    const userName = user?.name || 'Explorer'
    setLocalWaypoints((prev) =>
      (Array.isArray(prev) ? prev : []).map((pt) => {
        if (pt.id !== waypointId) return pt
        const conf = Array.isArray(pt.confirmed) ? pt.confirmed : []
        const pend = Array.isArray(pt.pending) ? pt.pending : []
        if (conf.includes(userName)) return pt
        return {
          ...pt,
          confirmed: [...conf, userName],
          pending: pend.filter((name) => name !== userName)
        }
      })
    )
  }

  const parseActivityDate = (dateVal) => {
    if (!dateVal) return 'Upcoming'
    try {
      const d = new Date(dateVal)
      return isNaN(d.getTime()) ? 'Upcoming' : d.toLocaleString()
    } catch {
      return 'Upcoming'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-[#f3f1ea]">
      
      {/* LEFT COLUMN: Trip Logistics & Organizer */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        
        {/* Meeting Point Interactive Route Map */}
        <div className="w-full h-44 bg-[#1a2129] border border-[#242f3d] rounded-2xl overflow-hidden relative flex flex-col justify-end p-3.5 shadow-lg">
          <div className="absolute inset-0 bg-[#161d24] flex items-center justify-center text-xs font-semibold text-[#6b757c]">
            🗺️ Interactive Route Meeting Point · [Lat: {activity?.meeting_point_lat || 19.07}, Lng: {activity?.meeting_point_lng || 72.87}]
          </div>
          <div className="bg-[#0c1013]/90 backdrop-blur-md p-2.5 px-3.5 rounded-xl z-10 flex flex-col text-white max-w-[85%] border border-white/10 shadow-md">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#ff6a2c]">Meeting Point</span>
            <span className="text-xs font-bold truncate mt-0.5">{meetingLabel}</span>
          </div>
        </div>

        {/* Destination Details Card */}
        <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-5 shadow-lg flex flex-col gap-2">
          <span className="text-[10px] font-bold text-[#ff6a2c] uppercase tracking-wider">
            Destination & Schedule
          </span>
          <h3 className="text-xl font-black text-[#f3f1ea] font-display">
            {activity?.destination || activity?.title || 'Trip Destination'}
          </h3>
          <div className="text-xs text-[#9ba6ad] flex flex-col gap-1.5 mt-2 bg-[#1a2129] p-3.5 rounded-xl border border-white/5">
            <span className="flex items-center gap-2">
              <span>📅</span>
              <span><strong>Scheduled:</strong> {parseActivityDate(activity?.date_time)}</span>
            </span>
            <span className="flex items-center gap-2">
              <span>💰</span>
              <span><strong>Estimated Budget:</strong> ₹{Number(activity?.cost_per_person || 0).toLocaleString('en-IN')} per traveler</span>
            </span>
            <span className="flex items-center gap-2">
              <span>📍</span>
              <span><strong>Meeting Point:</strong> {meetingLabel}</span>
            </span>
          </div>
        </div>

        {/* Host Profile Card */}
        <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={activity?.Creator?.Profile?.avatar_url}
              name={hostName}
              size="md"
              score={activity?.Creator?.trust_score || 85}
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#ff6a2c] uppercase tracking-wider">
                Trip Organizer
              </span>
              <span className="text-sm font-bold text-[#f3f1ea]">{hostName}</span>
              <span className="text-[11px] text-[#9ba6ad] mt-0.5">Trust Score: {activity?.Creator?.trust_score || 85} / 100</span>
            </div>
          </div>
        </div>

        {/* Live Location Share Toggle */}
        <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1 max-w-[75%]">
            <span className="text-sm font-bold text-[#f3f1ea]">Live GPS Location Sharing</span>
            <span className="text-xs text-[#9ba6ad] leading-relaxed">
              Periodically updates your coordinate marker to fellow confirmed travelers.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer w-11 h-6 flex-shrink-0">
            <input
              type="checkbox"
              checked={sharing}
              onChange={(e) => setSharing(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors ${
                sharing ? 'bg-[#ff6a2c]' : 'bg-[#212b33] border border-white/10'
              }`}
            />
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                sharing ? 'transform translate-x-5' : ''
              }`}
            />
          </label>
        </div>
      </div>

      {/* RIGHT COLUMN: Confirmed Members & Waypoints */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        
        {/* Confirmed Members Card */}
        <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="text-xs font-bold text-[#9ba6ad] uppercase tracking-wider">
              Confirmed Travelers ({safeMembers.length})
            </span>
            <span className="text-[11px] text-[#4fbe8e] font-bold">● Active Group</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {safeMembers.map((m) => {
              const rawName = m?.name || m?.User?.Profile?.name || 'Explorer'
              return (
                <div
                  key={m.userId || m.id || rawName}
                  onClick={() => onMemberTap && onMemberTap(m)}
                  className="p-2.5 bg-[#1a2129] border border-white/5 hover:border-[#ff6a2c]/30 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all active:scale-98"
                >
                  <Avatar
                    src={m.avatarUrl || m.User?.Profile?.avatar_url}
                    name={rawName}
                    size="sm"
                    score={m.trustScore || m.User?.trust_score || 80}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[#f3f1ea] truncate">{rawName}</span>
                    <span className="text-[10px] text-[#9ba6ad]">Verified</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Waypoints Checkpoints Card */}
        <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="text-xs font-bold text-[#9ba6ad] uppercase tracking-wider">
              Check-in Waypoints
            </span>
            <span className="text-[11px] text-[#ff6a2c] font-bold">Live Status</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {(Array.isArray(localWaypoints) ? localWaypoints : []).map((point) => (
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
    </div>
  )
}

export default InfoTab
export { InfoTab }
