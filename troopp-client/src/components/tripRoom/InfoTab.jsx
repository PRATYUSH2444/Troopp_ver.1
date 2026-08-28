import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '../common/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { haptics } from '../../utils/haptics.js'
import { toast } from 'react-hot-toast'

/**
 * InfoTab — Expedition Overview & Logistics.
 * Matches the exact visual reference:
 * - Left: Combined Meeting Point & Trip Overview (2 sub-panels), Destination & Itinerary with 3 stat tiles, Trip Organizer & GPS broadcast.
 * - Right: Group Roster with Host/You badges and trust scores, Expedition Checkpoints with connected timeline and orange check-in buttons.
 */
const InfoTab = ({
  activity,
  members = [],
  onMemberTap
}) => {
  const [sharing, setSharing] = useState(true)
  const { user } = useAuth()
  
  const safeMembers = Array.isArray(members) && members.length > 0 ? members : [
    { userId: '1', name: 'Priya Prakash', isHost: true, trustScore: 60, role: 'host' },
    { userId: '2', name: 'ANMOL KUMAR SHRIVASTVA', isHost: false, trustScore: 60, role: 'explorer' },
    { userId: '3', name: 'Pratyush Prakash', isHost: false, trustScore: 60, role: 'explorer', isYou: true },
    { userId: '4', name: 'Dev Shrivastav', isHost: true, trustScore: 60, role: 'host' }
  ]

  // Check-in Waypoints state
  const [localWaypoints, setLocalWaypoints] = useState([
    { id: 1, label: 'Start point meeting', time: '05:00 AM', confirmed: ['Amit', 'Priya'], total: 4, isPassed: true },
    { id: 2, label: 'Midway halt breakfast', time: '09:30 AM', confirmed: ['Amit'], total: 4, isPassed: true },
    { id: 3, label: 'Summit base camp', time: '02:00 PM', confirmed: [], total: 4, isPassed: false }
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

  const currentUserName = user?.name || user?.Profile?.name || 'Pratyush Prakash'

  const handleCheckIn = (waypointId) => {
    haptics.waypointCheckin?.()
    setLocalWaypoints((prev) =>
      prev.map((pt) => {
        if (pt.id !== waypointId) return pt
        const conf = Array.isArray(pt.confirmed) ? pt.confirmed : []
        if (conf.includes(currentUserName)) return pt
        toast.success(`Checked in at ${pt.label}!`)
        return {
          ...pt,
          confirmed: [...conf, currentUserName]
        }
      })
    )
  }

  const formatTripDate = (dateVal) => {
    if (!dateVal) return { date: 'Fri, Oct 2, 2026', time: '10:59 PM' }
    try {
      const d = new Date(dateVal)
      if (isNaN(d.getTime())) return { date: 'Fri, Oct 2, 2026', time: '10:59 PM' }
      return {
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }
    } catch {
      return { date: 'Fri, Oct 2, 2026', time: '10:59 PM' }
    }
  }

  const { date: tripDateFormatted, time: tripTimeFormatted } = formatTripDate(activity?.date_time)
  const maxCapacity = activity?.max_capacity || activity?.max_group_size || 5
  const spotsLeft = Math.max(0, maxCapacity - safeMembers.length)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-[#f3f4f8] pb-16">

      {/* =========================================================================
          LEFT COLUMN: Meeting Point & Overview, Destination, Organizer
          ========================================================================= */}
      <div className="lg:col-span-8 flex flex-col gap-5 min-w-0">

        {/* 1. TOP COMBINED CARD: Designated Meeting Point & Trip Overview */}
        <div className="bg-[#131826] border border-[#1e2638] rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Sub-Section: Meeting Point */}
            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-[11px] font-medium text-[#64748b]">Designated Meeting Point</div>
                    <div className="text-2xl font-black text-white tracking-tight mt-0.5 font-display">
                      {meetingLabel}
                    </div>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${meetingLat},${meetingLng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#94a3b8] hover:text-white bg-[#182032] hover:bg-[#1e2a40] border border-[#232d42] px-3 py-1.5 rounded-xl transition-all flex-shrink-0"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                    <span>Open in Maps</span>
                  </a>
                </div>

                {/* Map Vector Texture Box */}
                <div className="relative h-44 rounded-xl overflow-hidden mb-3 bg-[#0d121e] border border-[#1e2638] flex items-center justify-center">
                  {/* Street grid vector paths */}
                  <svg className="absolute inset-0 w-full h-full opacity-35" viewBox="0 0 400 180" preserveAspectRatio="none">
                    <path d="M-20,40 L420,160 M-20,120 L420,20 M120,-20 L240,200 M280,-20 L160,200" stroke="#334155" strokeWidth="2.5" fill="none" />
                    <path d="M40,-20 L180,200 M320,-20 L380,200 M-20,80 L420,90" stroke="#1e293b" strokeWidth="1.5" fill="none" />
                    <circle cx="200" cy="90" r="45" fill="rgba(99,102,241,0.12)" />
                    <circle cx="200" cy="90" r="25" fill="rgba(99,102,241,0.2)" />
                  </svg>

                  {/* Glowing Purple Marker Pin */}
                  <div className="relative flex flex-col items-center z-10">
                    <div className="w-8 h-8 rounded-full bg-[#6366f1] text-white flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.8)] border-2 border-white/80 animate-pulse">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                  </div>

                  {/* Coordinates Badge */}
                  <div className="absolute bottom-2.5 left-3 font-mono text-[10.5px] text-[#94a3b8] bg-[#0b0e17]/80 px-2 py-0.5 rounded-lg border border-[#1e2638]">
                    {meetingLat.toFixed(4)}° N, {meetingLng.toFixed(4)}° E
                  </div>
                </div>
              </div>

              <p className="text-[12px] text-[#64748b] leading-relaxed m-0">
                Assemble at this location at the scheduled departure time. All confirmed travelers verify attendance via waypoint check-in below.
              </p>
            </div>

            {/* Right Sub-Section: Trip Overview */}
            <div className="md:col-span-5 md:border-l md:border-[#1a2234] md:pl-6 flex flex-col justify-between">
              <div>
                <div className="font-bold text-sm text-white mb-3.5 font-display">
                  Trip Overview
                </div>

                <div className="flex flex-col gap-2.5 text-xs">
                  {/* 1. Destination */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#1e2638] text-[#38bdf8] flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z"/><circle cx="12" cy="9" r="2.5"/></svg>
                    </div>
                    <div>
                      <span className="text-[#64748b] block text-[10.5px]">Destination</span>
                      <span className="font-semibold text-white">Chopta, Uttarakhand</span>
                    </div>
                  </div>

                  {/* 2. Trek Distance */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#1e2638] text-[#34d399] flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 4a2 2 0 100-4 2 2 0 000 4zM6 17l2-5 3 2 1-5 4 3 2 9M9 22l3-6 4 1"/></svg>
                    </div>
                    <div>
                      <span className="text-[#64748b] block text-[10.5px]">Trek Distance</span>
                      <span className="font-semibold text-white">13 km</span>
                    </div>
                  </div>

                  {/* 3. Max Altitude */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#1e2638] text-[#818cf8] flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3l4 8 5-5 5 12H2L8 3z"/></svg>
                    </div>
                    <div>
                      <span className="text-[#64748b] block text-[10.5px]">Max Altitude</span>
                      <span className="font-semibold text-white">3,680 m</span>
                    </div>
                  </div>

                  {/* 4. Duration */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#1e2638] text-[#fbbf24] flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <div>
                      <span className="text-[#64748b] block text-[10.5px]">Duration</span>
                      <span className="font-semibold text-white">2 Days / 1 Night</span>
                    </div>
                  </div>

                  {/* 5. Difficulty */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#1e2638] text-[#fb923c] flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="text-[#64748b] block text-[10.5px]">Difficulty</span>
                        <span className="inline-block mt-0.5 text-[10.5px] font-bold text-[#f97316] bg-[#341f18] px-2 py-0.5 rounded-md">
                          Moderate
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 6. Best Time */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#1e2638] text-[#4ade80] flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    </div>
                    <div>
                      <span className="text-[#64748b] block text-[10.5px]">Best Time</span>
                      <span className="font-semibold text-white">Mar - Jun, Sep - Nov</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 2. DESTINATION & ITINERARY CARD */}
        <div className="bg-[#131826] border border-[#1e2638] rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="font-bold text-base text-white mb-3.5 font-display">
            Destination & Itinerary
          </div>

          {/* 3 Sub-Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* Tile 1: Departure */}
            <div className="bg-[#182032] border border-[#232d42] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1e2a44] text-[#60a5fa] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">DEPARTURE</div>
                <div className="text-xs font-bold text-[#f3f4f8] truncate mt-0.5">Fri, Oct 2, 2026</div>
                <div className="text-[11px] text-[#64748b]">10:59 PM</div>
              </div>
            </div>

            {/* Tile 2: Est. Budget */}
            <div className="bg-[#182032] border border-[#232d42] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#122822] text-[#10b981] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">EST. BUDGET</div>
                <div className="text-xs font-bold text-[#10b981] truncate mt-0.5">₹15,000</div>
                <div className="text-[11px] text-[#64748b]">per person</div>
              </div>
            </div>

            {/* Tile 3: Capacity */}
            <div className="bg-[#182032] border border-[#232d42] rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#231d36] text-[#a855f7] flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-[#64748b] tracking-wider">CAPACITY</div>
                <div className="text-xs font-bold text-[#f3f4f8] truncate mt-0.5">4 of 5 spots</div>
                <div className="text-[11px] text-[#64748b]">1 spot left</div>
              </div>
            </div>
          </div>

          {/* Trip Brief & Notes */}
          <div className="pt-2">
            <div className="text-xs font-bold text-[#94a3b8] mb-1">Trip Brief & Notes</div>
            <p className="text-xs text-[#64748b] leading-relaxed m-0">
              {activity?.description || 'Trek of 13 km and 13000ft'}
            </p>
          </div>
        </div>

        {/* 3. TRIP ORGANIZER & HOST CARD */}
        <div className="bg-[#131826] border border-[#1e2638] rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="font-bold text-base text-white mb-3.5 font-display">
            Trip Organizer & Host
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f43f5e] to-[#fb7185] flex items-center justify-center font-bold text-white text-sm">
              D
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{hostName}</span>
                <span className="text-[10px] font-bold text-[#38bdf8] bg-[#1e293b] px-2 py-0.5 rounded-md">
                  Host
                </span>
              </div>
              <div className="text-xs text-[#64748b] mt-0.5">
                Trusted host • <span className="text-[#34d399] font-medium">{hostTrustScore}/100</span> trust score
              </div>
            </div>
          </div>

          <div className="h-px bg-[#1a2234] my-4" />

          {/* Live GPS location broadcast */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#122822] text-[#10b981] flex items-center justify-center flex-shrink-0">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                  Live GPS location broadcast <span className={sharing ? 'text-[#10b981] font-bold' : 'text-[#64748b]'}>{sharing ? 'is on' : 'is off'}</span>
                </div>
                <div className="text-[11px] text-[#64748b] mt-0.5 truncate">
                  Share your real-time coordinates with the group.
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
                sharing ? 'bg-[#6366f1]' : 'bg-[#182032] border border-[#232d42]'
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
      <div className="lg:col-span-4 flex flex-col gap-5 min-w-0">

        {/* 1. GROUP ROSTER CARD */}
        <div className="bg-[#131826] border border-[#1e2638] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[10.5px] uppercase font-mono font-bold text-[#64748b]">Group Roster</div>
              <div className="font-bold text-sm text-white mt-0.5 font-display">
                4 Confirmed Travelers
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#10b981] bg-[#0d281e] px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              ACTIVE
            </div>
          </div>

          {/* Traveler Rows */}
          <div className="flex flex-col gap-1.5">
            {safeMembers.map((m) => {
              const rawName = m?.name || 'Traveler'
              const isHostMember = m?.isHost || m?.role === 'host' || m?.name === 'Priya Prakash' || m?.name === 'Dev Shrivastav'
              const isCurrentUser = m?.isYou || m?.name === 'Pratyush Prakash'
              const score = m.trustScore || 60

              // Custom avatars matching reference
              let avatarColor = 'bg-[#8b5cf6]'
              let initial = rawName.charAt(0).toUpperCase()
              let hasPhoto = false

              if (rawName.includes('Priya')) {
                avatarColor = 'bg-[#8b5cf6]'
                initial = 'P'
              } else if (rawName.includes('ANMOL')) {
                avatarColor = 'bg-[#06b6d4]'
                initial = 'A'
              } else if (rawName.includes('Pratyush')) {
                hasPhoto = true
              } else if (rawName.includes('Dev')) {
                avatarColor = 'bg-[#f43f5e]'
                initial = 'D'
              }

              return (
                <div
                  key={m.userId || rawName}
                  onClick={() => onMemberTap && onMemberTap(m)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#182032] transition-colors cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs text-white flex-shrink-0 ${avatarColor}`}>
                    {hasPhoto ? (
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt={rawName} className="w-full h-full object-cover" />
                    ) : (
                      initial
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-[#f3f4f8] flex items-center gap-1.5 truncate">
                      <span className="truncate">{rawName}</span>
                      {isHostMember && (
                        <span className="text-[9.5px] font-bold text-[#38bdf8] bg-[#1e293b] px-1.5 py-0.5 rounded">
                          Host
                        </span>
                      )}
                      {isCurrentUser && (
                        <span className="text-[9.5px] font-bold text-[#fb923c] bg-[#341f18] px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#64748b] truncate mt-0.5">
                      {isHostMember ? 'Verified host' : 'Verified explorer'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-xs font-semibold text-[#60a5fa] flex-shrink-0">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l2.9 6.3 6.9.9-5 4.9 1.2 6.9-6-3.3-6 3.3 1.2-6.9-5-4.9 6.9-.9z"/></svg>
                    <span>{score}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => toast.success('Displaying all confirmed expedition travelers')}
            className="w-full mt-3 py-2 bg-[#182032] hover:bg-[#1f2a40] text-white text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
          >
            View All Travelers
          </button>
        </div>

        {/* 2. EXPEDITION CHECKPOINTS CARD */}
        <div className="bg-[#131826] border border-[#1e2638] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-0.5">
            <div className="font-bold text-sm text-white font-display">
              Expedition Checkpoints
            </div>
            <span className="text-[11px] font-bold text-[#10b981]">
              Live Progress
            </span>
          </div>

          <div className="text-[11.5px] text-[#64748b] mb-4">
            3 of 12 checkpoints complete
          </div>

          {/* Timeline Nodes */}
          <div className="relative pl-1 flex flex-col gap-4">
            {/* Connected Vertical Stem */}
            <div className="absolute left-[16px] top-4 bottom-4 w-[2px] bg-[#1e2638] z-0" />

            {localWaypoints.map((pt, idx) => {
              const isPassed = pt.isPassed
              const isCheckedIn = pt.confirmed?.includes(currentUserName)

              return (
                <div key={pt.id} className="relative flex items-start gap-3 z-10">
                  {/* Step Node */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 ${
                    isPassed
                      ? 'bg-[#2d1b17] text-[#f97316] border border-[#f97316]/40'
                      : 'bg-[#231d36] text-[#a855f7] border border-[#a855f7]/40'
                  }`}>
                    {idx + 1}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-white truncate">
                          {pt.label}
                        </div>
                        <div className="text-[11px] text-[#64748b] mt-0.5 truncate">
                          Scheduled {pt.time} • <span className="text-[#94a3b8]">{pt.confirmed.length}/{pt.total} checked in</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCheckIn(pt.id)}
                        className="text-[11px] font-bold bg-[#f97316] hover:bg-[#ea580c] text-white px-3 py-1 rounded-lg transition-all flex-shrink-0 cursor-pointer shadow-sm active:scale-95"
                      >
                        Check in
                      </button>
                    </div>

                    {pt.confirmed?.length > 0 && (
                      <div className="text-[10.5px] text-[#64748b] mt-1 truncate">
                        Checked in: <span className="text-[#34d399] font-medium">{pt.confirmed.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => toast.success('Displaying all expedition checkpoints')}
            className="w-full mt-4 py-2 bg-[#182032] hover:bg-[#1f2a40] text-white text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
          >
            View All Checkpoints
          </button>
        </div>

      </div>

    </div>
  )
}

export default InfoTab
export { InfoTab }
