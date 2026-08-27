import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '../common/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { haptics } from '../../utils/haptics.js'

/**
 * Modernized InfoTab — Seamlessly integrates the new Tungnath / TripMate design
 * with existing dynamic backend data, WebSockets, and state management.
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
    { id: 1, label: 'Start point meeting', time: 'Scheduled 06:00 AM', confirmed: ['Amit', 'Priya'], total: 4 },
    { id: 2, label: 'Midway halt breakfast', time: 'Scheduled 09:30 AM', confirmed: ['Amit'], total: 4 },
    { id: 3, label: 'Summit base camp', time: 'Scheduled 02:00 PM', confirmed: [], total: 4 }
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

  // Calculate trail progress metrics
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-[#f3f4f8] pb-16">
      
      {/* =========================================================================
          LEFT COLUMN: Trip Logistics, Destination, Organizer & GPS
          ========================================================================= */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        
        {/* 1. DESIGNATED MEETING POINT CARD */}
        <div className="bg-[#12151f] border border-[#1c2130] rounded-[20px] p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#ffa471] mb-1 font-bold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z"/></svg>
                Designated meeting point
              </div>
              <div className="text-2xl font-bold font-display text-[#f3f4f8] capitalize">
                {meetingLabel}
              </div>
            </div>
            
            <a
              href={`https://maps.google.com/?q=${meetingLat},${meetingLng}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#9096ab] hover:text-[#f3f4f8] bg-[#1f2431] hover:border-[#ff7a3d] border border-[#262b3a] px-3.5 py-2 rounded-full transition-all flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
              <span>Open maps</span>
            </a>
          </div>

          {/* Map Canvas with Topographic Texture & Animated Pin */}
          <div className="relative h-48 rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-[#141a24] to-[#0c1017] border border-[#1c2130] flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
              <path d="M0,150 Q80,110 160,140 T400,120" stroke="#2a3040" strokeWidth="1" fill="none" />
              <path d="M0,110 Q90,70 180,100 T400,80" stroke="#2a3040" strokeWidth="1" fill="none" />
              <path d="M0,180 Q100,150 220,175 T400,155" stroke="#20242f" strokeWidth="1" fill="none" />
            </svg>

            {/* Central Animated Map Pin */}
            <div className="relative flex flex-col items-center z-10">
              <div className="w-8 h-8 rounded-t-full rounded-bl-full bg-[#ff7a3d] -rotate-45 flex items-center justify-center shadow-[0_0_0_6px_rgba(255,122,61,0.15)] animate-bounce">
                <svg className="rotate-45 w-4 h-4 fill-[#2a1204]" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>
              </div>
              <div className="w-3 h-1 rounded-full bg-black/40 blur-[2px] mt-1" />
            </div>

            {/* Coordinates Badge */}
            <div className="absolute bottom-2.5 left-3 font-mono text-xs text-[#9096ab] bg-[#0a0c13]/70 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/5">
              {meetingLat.toFixed(4)}° N, {meetingLng.toFixed(4)}° E
            </div>
          </div>

          <p className="text-sm text-[#9096ab] leading-relaxed m-0">
            Assemble at this location at the scheduled departure time. All confirmed travelers verify attendance via waypoint check-in below.
          </p>
        </div>

        {/* 2. DESTINATION AND ITINERARY CARD */}
        <div className="bg-[#12151f] border border-[#1c2130] rounded-[20px] p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#ffa471] mb-1 font-bold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0 0 21 18.618V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                Destination and itinerary
              </div>
              <div className="text-2xl font-bold font-display text-[#f3f4f8] capitalize">
                {activity?.destination || activity?.title || 'Chopta'}
              </div>
            </div>
          </div>

          {/* 3-Column Itinerary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#181c29] border border-[#1c2130] rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[11.5px] text-[#5c6178] uppercase font-bold tracking-wider mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                Departure
              </div>
              <div className="font-bold text-[15px] font-display text-[#f3f4f8]">
                {tripDateFormatted}
              </div>
              <div className="text-xs text-[#9096ab] mt-1">{tripTimeFormatted}</div>
            </div>

            <div className="bg-[#181c29] border border-[#1c2130] rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[11.5px] text-[#5c6178] uppercase font-bold tracking-wider mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Estimated budget
              </div>
              <div className="font-bold text-[15px] font-display text-[#33d189]">
                ₹{Number(activity?.cost_per_person || activity?.cost_estimate || 15000).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-[#9096ab] mt-1">per person</div>
            </div>

            <div className="bg-[#181c29] border border-[#1c2130] rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-[11.5px] text-[#5c6178] uppercase font-bold tracking-wider mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Capacity
              </div>
              <div className="font-bold text-[15px] font-display text-[#f3f4f8]">
                {safeMembers.length} of {maxCapacity} spots
              </div>
              <div className="text-xs text-[#9096ab] mt-1">{spotsLeft > 0 ? `${spotsLeft} spot left` : 'Fully booked'}</div>
            </div>
          </div>

          {/* Brief Box */}
          <div className="mt-3.5 p-4 bg-[#181c29] rounded-xl border border-[#1c2130]">
            <div className="text-[11.5px] text-[#5c6178] uppercase font-bold tracking-wider mb-1.5">
              Trip brief and notes
            </div>
            <p className="text-sm text-[#f3f4f8] leading-relaxed m-0">
              {activity?.description || 'Trek of 13 km and 13,000 ft. Pack for sub-zero nights and carry a headlamp for the summit push.'}
            </p>
          </div>
        </div>

        {/* 3. TRIP ORGANIZER AND HOST CARD */}
        <div className="bg-[#12151f] border border-[#1c2130] rounded-[20px] p-6 shadow-xl flex flex-col">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#ffa471] mb-4 font-bold">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 1v6M12 17v6M4.2 4.2l4.2 4.2M15.6 15.6l4.2 4.2M1 12h6M17 12h6M4.2 19.8l4.2-4.2M15.6 8.4l4.2-4.2"/></svg>
            Trip organizer and host
          </div>

          <div className="flex items-center gap-3.5">
            <Avatar
              src={hostAvatar}
              name={hostName}
              size="md"
              score={hostTrustScore}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base font-display text-[#f3f4f8]">{hostName}</span>
                <span className="w-4 h-4 rounded-full bg-[#4a9eff] flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
              </div>
              <div className="text-xs text-[#9096ab] mt-0.5">
                Verified host · <span className="text-[#33d189] font-semibold">{hostTrustScore}/100</span> trust score
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-[#1c2130] my-4" />

          {/* Live GPS Broadcast Toggle Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                sharing ? 'bg-[#3a2517] text-[#ffa471]' : 'bg-[#181c29] text-[#9096ab]'
              }`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
              </div>
              <div>
                <div className="font-semibold text-sm text-[#f3f4f8]">Live GPS location broadcast</div>
                <div className="text-xs text-[#9096ab] mt-0.5">
                  {sharing ? '🟢 Broadcasting real-time coordinates' : 'Share your real-time coordinates with the group'}
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
                sharing ? 'bg-[#ff7a3d]' : 'bg-[#1f2431] border border-[#262b3a]'
              }`} />
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                sharing ? 'transform translate-x-5' : ''
              }`} />
            </label>
          </div>
        </div>

      </div>

      {/* =========================================================================
          RIGHT COLUMN (SIDEBAR): Group Roster & Expedition Checkpoints
          ========================================================================= */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        
        {/* 1. GROUP ROSTER CARD */}
        <div className="bg-[#12151f] border border-[#1c2130] rounded-[20px] p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#ffa471] mb-1 font-bold">
                Group roster
              </div>
              <div className="font-bold text-lg font-display text-[#f3f4f8]">
                Confirmed travelers ({safeMembers.length})
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#33d189] bg-[#122a20] px-3 py-1 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#33d189] animate-pulse" />
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
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#181c29] transition-colors cursor-pointer"
                >
                  <Avatar
                    src={m.avatarUrl || m.User?.Profile?.avatar_url}
                    name={rawName}
                    size="sm"
                    score={score}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#f3f4f8] flex items-center gap-2 truncate">
                      <span className="truncate">{rawName}</span>
                      {isCurrentUser && (
                        <span className="text-[10.5px] text-[#ffa471] bg-[#3a2517] px-1.5 py-0.5 rounded-md font-bold flex-shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#9096ab] mt-0.5 truncate">
                      {isHostMember ? 'Verified host' : 'Verified explorer'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-xs font-semibold text-[#4a9eff] bg-[rgba(74,158,255,0.1)] px-2.5 py-1 rounded-full flex-shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l2.9 6.3 6.9.9-5 4.9 1.2 6.9-6-3.3-6 3.3 1.2-6.9-5-4.9 6.9-.9z"/></svg>
                    <span>{score}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 2. EXPEDITION CHECKPOINTS / TRAIL CARD */}
        <div className="bg-[#12151f] border border-[#1c2130] rounded-[20px] p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#ffa471] font-bold">
              Expedition checkpoints
            </div>
            <span className="text-[11.5px] font-bold text-[#ffa471] bg-[#3a2517] px-3 py-0.5 rounded-full">
              Live progress
            </span>
          </div>

          <div className="font-bold text-lg font-display text-[#f3f4f8] mb-1.5">
            Check-in waypoints
          </div>

          {/* Progress Summary & Track */}
          <div className="text-xs text-[#9096ab] mb-3">
            <b className="text-[#f3f4f8]">{currentCheckinsDone}</b> of {totalCheckinsPossible} check-ins complete across the trail
          </div>
          <div className="h-1.5 bg-[#181c29] rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-gradient-to-r from-[#ff7a3d] to-[#ffa471] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Vertical Trail Stem */}
          <div className="relative pl-1 flex flex-col gap-5">
            <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-[#262b3a] z-0" />

            {localWaypoints.map((pt, idx) => {
              const isCheckedIn = pt.confirmed?.includes(currentUserName)
              const isDone = pt.confirmed?.length >= pt.total
              const isPartial = pt.confirmed?.length > 0 && !isDone

              return (
                <div key={pt.id} className="relative flex gap-3.5 z-10">
                  {/* Step Node */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 transition-all ${
                    isDone
                      ? 'bg-[#33d189] text-[#062017] border-2 border-[#33d189]'
                      : isPartial
                      ? 'bg-[#3a2517] text-[#ffa471] border-2 border-[#ff7a3d]'
                      : 'bg-[#181c29] text-[#9096ab] border-2 border-[#262b3a]'
                  }`}>
                    {isDone ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="font-bold text-sm font-display text-[#f3f4f8] truncate">
                          {pt.label}
                        </div>
                        <div className="text-xs text-[#5c6178] font-mono mt-0.5">
                          {pt.time} · <span className="text-[#9096ab]">{pt.confirmed.length}/{pt.total}</span> checked in
                        </div>
                      </div>

                      {isCheckedIn ? (
                        <button
                          disabled
                          className="text-xs font-bold text-[#33d189] bg-[#181c29] border border-[#33d189] px-3.5 py-1.5 rounded-full flex-shrink-0"
                        >
                          Checked in
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCheckIn(pt.id)}
                          className="text-xs font-bold bg-[#ff7a3d] hover:bg-[#ffa471] text-[#2a1204] px-3.5 py-1.5 rounded-full transition-all flex-shrink-0 cursor-pointer active:scale-95"
                        >
                          Check in
                        </button>
                      )}
                    </div>

                    {pt.confirmed?.length > 0 && (
                      <div className="text-xs text-[#33d189] mt-1.5 truncate">
                        Checked in: <span className="text-[#9096ab]">{pt.confirmed.join(', ')}</span>
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
