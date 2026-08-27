import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '../common/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { haptics } from '../../utils/haptics.js'

/**
 * Modernized InfoTab — Comprehensive Expedition Logistics, Live GPS & Interactive Waypoints Hub.
 * Strictly adheres to Troopp's design system (24-28px spacing, rounded-[20px] cards, and rich interactive states).
 */
const InfoTab = ({
  activity,
  members = [],
  onMemberTap
}) => {
  const [sharing, setSharing] = useState(false)
  const { user } = useAuth()
  
  const safeMembers = Array.isArray(members) ? members : []

  // Check-in Waypoints state
  const [localWaypoints, setLocalWaypoints] = useState([
    { id: 1, label: 'Start Point Meeting', time: '06:00 AM', confirmed: ['Amit', 'Priya'], pending: ['Vikram', user?.name || 'Explorer'] },
    { id: 2, label: 'Midway Halt Breakfast', time: '09:30 AM', confirmed: ['Amit'], pending: ['Priya', 'Vikram', user?.name || 'Explorer'] },
    { id: 3, label: 'Summit Base Camp', time: '02:00 PM', confirmed: [], pending: ['Amit', 'Priya', 'Vikram', user?.name || 'Explorer'] }
  ])

  // GPS Sharing simulation
  useEffect(() => {
    let interval
    if (sharing) {
      interval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            console.log(`[LIVE GPS] Lat: ${pos.coords.latitude}, Lng: ${pos.coords.longitude}`)
          })
        }
      }, 30000)
    }
    return () => clearInterval(interval)
  }, [sharing])

  const meetingLabel = activity?.meeting_point_label || activity?.destination || 'City Meeting Hub'
  const meetingLat = activity?.meeting_point_lat || 19.6175
  const meetingLng = activity?.meeting_point_lng || 73.7845
  const hostName = activity?.Creator?.Profile?.name || 'Trip Leader'
  const hostAvatar = activity?.Creator?.Profile?.avatar_url
  const hostTrustScore = activity?.Creator?.trust_score || 85

  const handleCheckIn = (waypointId) => {
    const currentUserName = user?.name || user?.Profile?.name || 'Explorer'
    haptics.waypointCheckin?.()
    setLocalWaypoints((prev) =>
      prev.map((pt) => {
        if (pt.id !== waypointId) return pt
        const conf = Array.isArray(pt.confirmed) ? pt.confirmed : []
        const pend = Array.isArray(pt.pending) ? pt.pending : []
        if (conf.includes(currentUserName)) return pt
        return {
          ...pt,
          confirmed: [...conf, currentUserName],
          pending: pend.filter((n) => n !== currentUserName)
        }
      })
    )
  }

  const formatTripDate = (dateVal) => {
    if (!dateVal) return 'Upcoming'
    try {
      const d = new Date(dateVal)
      if (isNaN(d.getTime())) return 'Upcoming'
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Upcoming'
    }
  }

  const currentUserName = user?.name || user?.Profile?.name || 'Explorer'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-[#f3f1ea] pb-16">
      
      {/* =========================================================================
          LEFT COLUMN: Trip Logistics, Destination, Organizer & GPS
          ========================================================================= */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        
        {/* 1. MEETING POINT & ROUTE HERO CARD */}
        <div className="bg-[#151c24] border border-[#242f3d] rounded-[20px] overflow-hidden shadow-lg flex flex-col">
          {/* Simulated Satellite Map Header */}
          <div className="w-full h-44 sm:h-48 bg-[#11171d] relative flex items-center justify-center p-4 border-b border-white/5 overflow-hidden">
            {/* Ambient Map Grid lines */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: 'radial-gradient(#ff6a2c 1px, transparent 1px), radial-gradient(#242f3d 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px'
              }}
            />
            
            {/* Map Pin Pulse */}
            <div className="relative flex flex-col items-center z-10">
              <div className="relative">
                <span className="w-9 h-9 rounded-full bg-[#ff6a2c]/20 border border-[#ff6a2c] flex items-center justify-center text-lg animate-bounce">
                  📍
                </span>
                <span className="absolute -inset-1 rounded-full bg-[#ff6a2c]/30 animate-ping" />
              </div>
              <span className="mt-2 text-[11px] font-mono font-bold text-[#9ba6ad] bg-[#0c1013]/90 px-3 py-1 rounded-full border border-white/10 shadow-md">
                {meetingLat.toFixed(4)}° N, {meetingLng.toFixed(4)}° E
              </span>
            </div>

            {/* Top Right Directions Action */}
            <a
              href={`https://maps.google.com/?q=${meetingLat},${meetingLng}`}
              target="_blank"
              rel="noreferrer"
              className="absolute top-3.5 right-3.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/15 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md z-10"
            >
              <span>🧭</span>
              <span>Open Maps</span>
            </a>
          </div>

          {/* Meeting Point Content Body */}
          <div className="p-6 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-[#ff6a2c] uppercase tracking-wider">
              Designated Meeting Point
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-[#f3f1ea] font-display">
              {meetingLabel}
            </h3>
            <p className="text-xs text-[#9ba6ad] leading-relaxed mt-1">
              Assemble at this location at the scheduled departure time. All confirmed travelers will verify attendance via waypoint check-in.
            </p>
          </div>
        </div>

        {/* 2. DESTINATION & EXPEDITION SCHEDULE CARD */}
        <div className="bg-[#151c24] border border-[#242f3d] p-6 sm:p-7 rounded-[20px] shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
            <div>
              <span className="text-[10px] font-bold text-[#ff6a2c] uppercase tracking-wider">
                Destination & Itinerary
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#f3f1ea] font-display mt-0.5 capitalize">
                {activity?.destination || activity?.title || 'Trip Destination'}
              </h3>
            </div>
            {activity?.category && (
              <span className="text-xs font-bold text-[#ff6a2c] bg-[rgba(255,106,44,0.14)] border border-[#ff6a2c]/30 px-3 py-1 rounded-full capitalize">
                {activity.category}
              </span>
            )}
          </div>

          {/* 3-Col Key Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-[#1a2129] border border-white/5 rounded-xl flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#9ba6ad] uppercase">📅 Departure</span>
              <span className="text-xs font-bold text-[#f3f1ea]">
                {formatTripDate(activity?.date_time)}
              </span>
            </div>

            <div className="p-3.5 bg-[#1a2129] border border-white/5 rounded-xl flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#9ba6ad] uppercase">💰 Estimated Budget</span>
              <span className="text-xs font-bold text-[#4fbe8e]">
                ₹{Number(activity?.cost_per_person || activity?.cost_estimate || 0).toLocaleString('en-IN')} / person
              </span>
            </div>

            <div className="p-3.5 bg-[#1a2129] border border-white/5 rounded-xl flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#9ba6ad] uppercase">👥 Capacity</span>
              <span className="text-xs font-bold text-[#f3f1ea]">
                {safeMembers.length} of {activity?.max_capacity || activity?.max_group_size || 5} Spots
              </span>
            </div>
          </div>

          {/* Trip Description if available */}
          {activity?.description && (
            <div className="mt-1 p-4 bg-[#1a2129]/60 border border-white/5 rounded-xl">
              <span className="text-[10px] font-bold text-[#9ba6ad] uppercase tracking-wider block mb-1.5">
                Trip Brief & Notes
              </span>
              <p className="text-xs text-[#d1d7dc] leading-relaxed m-0">
                {activity.description}
              </p>
            </div>
          )}
        </div>

        {/* 3. TRIP ORGANIZER & LIVE GPS COMBINED CARD */}
        <div className="bg-[#151c24] border border-[#242f3d] p-6 rounded-[20px] shadow-lg flex flex-col gap-5">
          {/* Organizer Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Avatar
                src={hostAvatar}
                name={hostName}
                size="md"
                score={hostTrustScore}
              />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#ff6a2c] uppercase tracking-wider">
                  Trip Organizer & Host
                </span>
                <span className="text-sm sm:text-base font-bold text-[#f3f1ea]">{hostName}</span>
                <span className="text-[11px] text-[#4fbe8e] font-semibold mt-0.5">
                  Verified Host · {hostTrustScore}/100 Trust Score
                </span>
              </div>
            </div>
          </div>

          {/* Live GPS Tracker Row */}
          <div className="p-4 bg-[#1a2129] border border-white/5 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📡</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#f3f1ea]">Live GPS Location Broadcast</span>
                <span className="text-[11px] text-[#9ba6ad] mt-0.5">
                  {sharing ? '🟢 Actively broadcasting location to travelers' : 'Share your real-time coordinates with the group'}
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer w-11 h-6 flex-shrink-0">
              <input
                type="checkbox"
                checked={sharing}
                onChange={(e) => {
                  haptics.lightTap?.()
                  setSharing(e.target.checked)
                }}
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
      </div>

      {/* =========================================================================
          RIGHT COLUMN: Confirmed Travelers & Interactive Waypoints Timeline
          ========================================================================= */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        
        {/* 1. CONFIRMED TRAVELERS ROSTER CARD */}
        <div className="bg-[#151c24] border border-[#242f3d] p-6 sm:p-7 rounded-[20px] shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
            <div>
              <span className="text-[10px] font-bold text-[#9ba6ad] uppercase tracking-wider">
                Group Roster
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#f3f1ea] font-display mt-0.5">
                Confirmed Travelers ({safeMembers.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-[#4fbe8e] bg-[rgba(79,190,142,0.12)] border border-[#4fbe8e]/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4fbe8e] animate-pulse" />
              <span>Active Expedition</span>
            </span>
          </div>

          {/* Travelers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {safeMembers.map((m) => {
              const rawName = m?.name || m?.User?.Profile?.name || 'Explorer'
              const isCurrentUser = m?.userId === user?.id || m?.id === user?.id
              const score = m.trustScore || m.User?.trust_score || 80

              return (
                <div
                  key={m.userId || m.id || rawName}
                  onClick={() => onMemberTap && onMemberTap(m)}
                  className="p-3.5 bg-[#1a2129] border border-white/5 hover:border-[#ff6a2c]/40 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-98 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={m.avatarUrl || m.User?.Profile?.avatar_url}
                      name={rawName}
                      size="sm"
                      score={score}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#f3f1ea] truncate group-hover:text-[#ff6a2c] transition-colors" title={rawName}>
                        {rawName} {isCurrentUser && '(You)'}
                      </span>
                      <span className="text-[10px] text-[#9ba6ad] mt-0.5">
                        Verified Explorer
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-[#4fbe8e] bg-[#212b33] px-2 py-0.5 rounded-md flex-shrink-0">
                    🛡️ {score}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 2. CHECK-IN WAYPOINTS INTERACTIVE TIMELINE CARD */}
        <div className="bg-[#151c24] border border-[#242f3d] p-6 sm:p-7 rounded-[20px] shadow-lg flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3.5">
            <div>
              <span className="text-[10px] font-bold text-[#ff6a2c] uppercase tracking-wider">
                Expedition Checkpoints
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#f3f1ea] font-display mt-0.5">
                Check-in Waypoints
              </h3>
            </div>
            <span className="text-xs font-bold text-[#ff6a2c] bg-[rgba(255,106,44,0.12)] border border-[#ff6a2c]/30 px-3 py-1 rounded-full">
              Live Progress
            </span>
          </div>

          {/* Interactive Timeline List */}
          <div className="flex flex-col gap-3.5 relative">
            {localWaypoints.map((pt, idx) => {
              const isCheckedIn = pt.confirmed?.includes(currentUserName)
              const confirmedCount = pt.confirmed?.length || 0
              const totalRequired = (pt.confirmed?.length || 0) + (pt.pending?.length || 0)

              return (
                <div
                  key={pt.id}
                  className={`p-4 sm:p-4.5 rounded-xl border transition-all flex flex-col gap-3 ${
                    isCheckedIn
                      ? 'bg-[rgba(79,190,142,0.06)] border-[rgba(79,190,142,0.3)]'
                      : 'bg-[#1a2129] border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Step Indicator Badge */}
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          isCheckedIn
                            ? 'bg-[#4fbe8e] text-[#10151a]'
                            : 'bg-[#212b33] text-[#9ba6ad] border border-white/10'
                        }`}
                      >
                        {isCheckedIn ? '✓' : idx + 1}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-[#f3f1ea] truncate">
                          {pt.label}
                        </span>
                        <span className="text-[11px] text-[#9ba6ad] mt-0.5">
                          Scheduled: {pt.time} · {confirmedCount}/{totalRequired} Checked In
                        </span>
                      </div>
                    </div>

                    {/* Interactive Check-in Button */}
                    {isCheckedIn ? (
                      <span className="text-xs font-bold text-[#4fbe8e] bg-[rgba(79,190,142,0.15)] px-3 py-1 rounded-lg flex-shrink-0">
                        ✓ Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(pt.id)}
                        className="h-8 px-4 bg-gradient-to-r from-[#ff6a2c] to-[#d9481a] hover:opacity-95 text-[#1a0e08] rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all cursor-pointer flex-shrink-0"
                      >
                        Check In
                      </button>
                    )}
                  </div>

                  {/* Confirmed list avatars strip */}
                  {pt.confirmed?.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5 text-[11px] text-[#9ba6ad]">
                      <span className="font-semibold text-[#4fbe8e]">Checked In:</span>
                      <span className="truncate text-[#f3f1ea]">
                        {pt.confirmed.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InfoTab
export { InfoTab }
