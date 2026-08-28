import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '../common/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { haptics } from '../../utils/haptics.js'

/**
 * InfoTab — Pixel-precise layout with standardized spacing tokens.
 *
 * Design tokens applied:
 *   Card bg:       #12151f (--surface)
 *   Nested bg:     #181c29 (--surface-2)
 *   Border:        #1c2130 (--border)
 *   Card padding:  24px (p-6)
 *   Card radius:   16px (rounded-2xl)
 *   Card gap:      20px (gap-5)
 *   Section label: 11px mono uppercase #ffa471
 *   Card title:    text-xl font-bold #f3f4f8
 *   Body text:     text-sm #9096ab
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
    { id: 1, label: 'Start point meeting', time: '06:00 AM', confirmed: ['Amit', 'Priya'], total: 4 },
    { id: 2, label: 'Midway halt breakfast', time: '09:30 AM', confirmed: ['Amit'], total: 4 },
    { id: 3, label: 'Summit base camp', time: '02:00 PM', confirmed: [], total: 4 }
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

  const meetingLabel = activity?.meeting_point_label || activity?.destination || 'Delhi'
  const meetingLat = activity?.meeting_point_lat || 19.6175
  const meetingLng = activity?.meeting_point_lng || 73.7845
  const hostName = activity?.Creator?.Profile?.name || 'Dev Shrivastav'
  const hostAvatar = activity?.Creator?.Profile?.avatar_url
  const hostTrustScore = activity?.Creator?.trust_score || 60

  const currentUserName = user?.name || user?.Profile?.name || 'Explorer'

  const handleCheckIn = (waypointId) => {
    haptics.waypointCheckin?.()
    setLocalWaypoints((prev) =>
      prev.map((pt) => {
        if (pt.id !== waypointId) return pt
        const conf = Array.isArray(pt.confirmed) ? pt.confirmed : []
        if (conf.includes(currentUserName)) return pt
        return {
          ...pt,
          confirmed: [...conf, currentUserName]
        }
      })
    )
  }

  // Progress metrics
  const totalCheckinsPossible = localWaypoints.length * (safeMembers.length || 4)
  const currentCheckinsDone = localWaypoints.reduce((acc, pt) => acc + (pt.confirmed?.length || 0), 0)
  const progressPercent = totalCheckinsPossible > 0 ? Math.round((currentCheckinsDone / totalCheckinsPossible) * 100) : 0

  const formatTripDate = (dateVal) => {
    if (!dateVal) return { date: 'Fri, Oct 2, 2026', time: '10:59 PM' }
    try {
      const d = new Date(dateVal)
      if (isNaN(d.getTime())) return { date: 'Upcoming', time: '10:00 AM' }
      return {
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
    } catch {
      return { date: 'Upcoming', time: '10:00 AM' }
    }
  }

  const { date: tripDateFormatted, time: tripTimeFormatted } = formatTripDate(activity?.date_time)
  const maxCapacity = activity?.max_capacity || activity?.max_group_size || 5
  const spotsLeft = Math.max(0, maxCapacity - safeMembers.length)

  const SectionLabel = ({ children, icon }) => (
    <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#4fbe8e] font-bold mb-1">
      {icon}
      <span>{children}</span>
    </div>
  )

  const CardTitle = ({ children }) => (
    <h3 className="text-xl font-bold text-[#f3f1ea] capitalize leading-tight mb-3" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      {children}
    </h3>
  )

  return (
    <div className="info-tab-grid grid grid-cols-1 gap-6 items-start text-[#f3f1ea] pb-16">

      {/* =========================================================================
          LEFT COLUMN: Meeting Point, Destination Briefing, Organizer
          ========================================================================= */}
      <div className="flex flex-col gap-6 min-w-0">

        {/* 1. MEETING POINT CARD */}
        <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <SectionLabel icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z"/></svg>}>
                Designated Meeting Point
              </SectionLabel>
              <CardTitle>{meetingLabel}</CardTitle>
            </div>
            <a
              href={`https://maps.google.com/?q=${meetingLat},${meetingLng}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-[#ff6a2c] bg-[#ff6a2c]/10 hover:bg-[#ff6a2c]/20 border border-[#ff6a2c]/30 px-4 py-2 rounded-full transition-all flex-shrink-0"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
              <span>Open in Maps</span>
            </a>
          </div>

          {/* Stylized Topographic Elevation Map Canvas */}
          <div className="relative h-44 rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-[#10151a] to-[#0c1013] border border-white/5 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 200" preserveAspectRatio="none">
              <path d="M0,150 Q80,110 160,140 T400,120" stroke="#4fbe8e" strokeWidth="1" fill="none" />
              <path d="M0,110 Q90,70 180,100 T400,80" stroke="#4fbe8e" strokeWidth="1" fill="none" />
              <path d="M0,180 Q100,150 220,175 T400,155" stroke="#ff6a2c" strokeWidth="1" fill="none" opacity="0.6" />
            </svg>
            
            {/* Animated Expedition Pin */}
            <div className="relative flex flex-col items-center z-10">
              <div className="w-8 h-8 rounded-t-full rounded-bl-full bg-[#ff6a2c] -rotate-45 flex items-center justify-center shadow-[0_0_0_6px_rgba(255,106,44,0.25)]">
                <svg className="rotate-45 w-4 h-4 fill-[#10151a]" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>
              </div>
              <div className="w-3 h-1 rounded-full bg-black/50 blur-[2px] mt-1" />
            </div>

            {/* Coordinates */}
            <div className="absolute bottom-3 left-3 font-mono text-[11px] text-[#9ba6ad] bg-[#0c1013]/90 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10">
              {meetingLat.toFixed(4)}° N, {meetingLng.toFixed(4)}° E
            </div>
          </div>

          <p className="text-sm text-[#9ba6ad] leading-relaxed m-0 max-w-[560px]">
            Assemble at this coordinate pin at the designated departure time. Confirmed travelers verify arrival via the live checkpoint tracker.
          </p>
        </div>

        {/* 2. DESTINATION & ITINERARY CARD */}
        <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-6 shadow-xl">
          <SectionLabel icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0 0 21 18.618V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>}>
            Expedition Briefing & Route
          </SectionLabel>
          <CardTitle>{activity?.destination || activity?.title || 'Chopta'}</CardTitle>

          {/* 3-Column Stat Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-[#10151a] border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[90px]">
              <div className="flex items-center gap-1.5 text-[10.5px] text-[#6b757c] uppercase font-bold tracking-wider">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                Departure
              </div>
              <div className="mt-2">
                <div className="font-bold text-[14.5px] text-[#f3f1ea]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                  {tripDateFormatted}
                </div>
                <div className="text-xs text-[#9ba6ad] mt-0.5">{tripTimeFormatted}</div>
              </div>
            </div>

            <div className="bg-[#10151a] border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[90px]">
              <div className="flex items-center gap-1.5 text-[10.5px] text-[#6b757c] uppercase font-bold tracking-wider">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Estimated Budget
              </div>
              <div className="mt-2">
                <div className="font-bold text-[14.5px] text-[#4fbe8e]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                  ₹{Number(activity?.cost_per_person || activity?.cost_estimate || 15000).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-[#9ba6ad] mt-0.5">per person</div>
              </div>
            </div>

            <div className="bg-[#10151a] border border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[90px]">
              <div className="flex items-center gap-1.5 text-[10.5px] text-[#6b757c] uppercase font-bold tracking-wider">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Group Size
              </div>
              <div className="mt-2">
                <div className="font-bold text-[14.5px] text-[#f3f1ea]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                  {safeMembers.length} of {maxCapacity} spots
                </div>
                <div className="text-xs text-[#9ba6ad] mt-0.5">{spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left` : 'Fully booked'}</div>
              </div>
            </div>
          </div>

          {/* Notes Card */}
          <div className="p-4 bg-[#10151a] rounded-xl border border-white/5">
            <div className="text-[10.5px] text-[#6b757c] uppercase font-bold tracking-wider mb-1.5">
              Expedition Notes & Trail Directives
            </div>
            <p className="text-sm text-[#f3f1ea] leading-relaxed m-0">
              {activity?.description || 'Trail briefing: Pack cold-weather layers, emergency headlamps, and personal hydration gear. Keep offline maps downloaded.'}
            </p>
          </div>
        </div>

        {/* 3. ORGANIZER & GPS BROADCAST */}
        <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-6 shadow-xl">
          <SectionLabel icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 1v6M12 17v6M4.2 4.2l4.2 4.2M15.6 15.6l4.2 4.2M1 12h6M17 12h6M4.2 19.8l4.2-4.2M15.6 8.4l4.2-4.2"/></svg>}>
            Lead Organizer & Host
          </SectionLabel>

          <div className="flex items-center gap-3.5 mt-3 mb-5">
            <Avatar
              src={hostAvatar}
              name={hostName}
              size="md"
              score={hostTrustScore}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[#f3f1ea]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>{hostName}</span>
                <span className="w-4 h-4 rounded-full bg-[#4fbe8e] flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10151a" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
              </div>
              <div className="text-xs text-[#9ba6ad] mt-0.5">
                Verified expedition host · <span className="text-[#4fbe8e] font-semibold">{hostTrustScore}/100</span> peer trust score
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5 mb-5" />

          {/* GPS Broadcast Control */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                sharing ? 'bg-[#ff6a2c]/20 text-[#ff6a2c]' : 'bg-[#10151a] text-[#9ba6ad]'
              }`}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-[#f3f1ea]">Live GPS Location Broadcast</div>
                <div className="text-xs text-[#9ba6ad] mt-0.5 truncate">
                  {sharing ? '🟢 Broadcasting live coordinates to expedition members' : 'Share your real-time coordinates with fellow travelers'}
                </div>
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
              <div className={`w-11 h-6 rounded-full transition-colors ${
                sharing ? 'bg-[#ff6a2c]' : 'bg-[#10151a] border border-white/10'
              }`} />
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                sharing ? 'transform translate-x-5' : ''
              }`} />
            </label>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: Confirmed Roster + Waypoint Timeline
          ========================================================================= */}
      <div className="flex flex-col gap-6 min-w-0">

        {/* 1. GROUP ROSTER CARD */}
        <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <SectionLabel>Traveler Roster</SectionLabel>
              <div className="font-bold text-lg text-[#f3f1ea] mt-0.5" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                Confirmed Members ({safeMembers.length})
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4fbe8e] bg-[#4fbe8e]/10 px-3 py-1 rounded-full uppercase tracking-wider flex-shrink-0 border border-[#4fbe8e]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4fbe8e] animate-pulse" />
              Active
            </div>
          </div>

          {/* Traveler Rows */}
          <div className="flex flex-col gap-1.5">
            {safeMembers.map((m) => {
              const rawName = m?.name || m?.User?.Profile?.name || 'Explorer'
              const isCurrentUser = m?.userId === user?.id || m?.id === user?.id
              const score = m.trustScore || m.User?.trust_score || 60
              const isHostMember = m?.isHost || m?.role === 'host' || m?.userId === activity?.creator_id

              return (
                <div
                  key={m.userId || m.id || rawName}
                  onClick={() => onMemberTap && onMemberTap(m)}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Avatar
                    src={m.avatarUrl || m.User?.Profile?.avatar_url}
                    name={rawName}
                    size="sm"
                    score={score}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#f3f1ea] flex items-center gap-2 truncate">
                      <span className="truncate">{rawName}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] text-[#ff6a2c] bg-[#ff6a2c]/10 px-2 py-0.5 rounded-full font-bold border border-[#ff6a2c]/20 flex-shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#9ba6ad] mt-0.5 truncate">
                      {isHostMember ? 'Verified Expedition Host' : 'Verified Explorer'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-xs font-semibold text-[#4fbe8e] bg-[#4fbe8e]/10 px-2.5 py-1 rounded-full flex-shrink-0 border border-[#4fbe8e]/20">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l2.9 6.3 6.9.9-5 4.9 1.2 6.9-6-3.3-6 3.3 1.2-6.9-5-4.9 6.9-.9z"/></svg>
                    <span>{score}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 2. EXPEDITION CHECKPOINTS TIMELINE */}
        <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <SectionLabel>Expedition Checkpoints</SectionLabel>
            <span className="text-[11px] font-bold text-[#ff6a2c] bg-[#ff6a2c]/10 px-3 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 border border-[#ff6a2c]/20">
              Live Tracker
            </span>
          </div>

          <div className="font-bold text-lg text-[#f3f1ea] mb-2" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
            Check-In Waypoints
          </div>

          {/* Progress Summary */}
          <div className="text-xs text-[#9ba6ad] mb-3">
            <b className="text-[#f3f1ea]">{currentCheckinsDone}</b> of {totalCheckinsPossible} check-ins confirmed across the trail
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-[#10151a] rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-[#ff6a2c] to-[#4fbe8e] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Waypoint Timeline */}
          <div className="relative pl-1 flex flex-col gap-6">
            {/* Vertical stem */}
            <div className="absolute left-[17px] top-5 bottom-5 w-[2px] bg-white/10 z-0" />

            {localWaypoints.map((pt, idx) => {
              const isCheckedIn = pt.confirmed?.includes(currentUserName)
              const isDone = pt.confirmed?.length >= pt.total
              const isPartial = pt.confirmed?.length > 0 && !isDone

              return (
                <div key={pt.id} className="relative flex gap-4 z-10">
                  {/* Node Circle */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 transition-all ${
                    isDone
                      ? 'bg-[#4fbe8e] text-[#10151a] border-2 border-[#4fbe8e]'
                      : isPartial
                      ? 'bg-[#ff6a2c]/20 text-[#ff6a2c] border-2 border-[#ff6a2c]'
                      : 'bg-[#10151a] text-[#9ba6ad] border-2 border-white/10'
                  }`}>
                    {isDone ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-[#f3f1ea] truncate" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                          {pt.label}
                        </div>
                        <div className="text-xs text-[#6b757c] font-mono mt-0.5">
                          Scheduled {pt.time} · <span className="text-[#9ba6ad]">{pt.confirmed.length}/{pt.total}</span> verified
                        </div>
                      </div>

                      {isCheckedIn ? (
                        <button
                          disabled
                          className="text-xs font-bold text-[#4fbe8e] bg-[#4fbe8e]/10 border border-[#4fbe8e]/30 px-4 py-1.5 rounded-full flex-shrink-0 min-w-[90px] text-center"
                        >
                          Checked in ✓
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCheckIn(pt.id)}
                          className="text-xs font-bold bg-gradient-to-r from-[#ff6a2c] to-[#d9481a] hover:opacity-90 text-[#1a0e08] px-4 py-1.5 rounded-full transition-all flex-shrink-0 cursor-pointer active:scale-95 min-w-[90px] text-center shadow-md shadow-[#ff6a2c]/20"
                        >
                          Check in
                        </button>
                      )}
                    </div>

                    {pt.confirmed?.length > 0 && (
                      <div className="text-xs text-[#9ba6ad] mt-1.5 truncate">
                        Verified: <span className="text-[#4fbe8e] font-medium">{pt.confirmed.join(', ')}</span>
                      </div>
                    )}
                  </div>
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
