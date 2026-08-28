import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import Avatar from '../common/Avatar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { haptics } from '../../utils/haptics.js'
import toast from 'react-hot-toast'

/**
 * InfoTab — Production-Grade Expedition Briefing & Live Route Control.
 * Pure Troopp design system tokens: #1a2129 surface, 20px radii, generous padding, Space Grotesk typography.
 */
const InfoTab = ({
  activity,
  members = [],
  socket,
  roomId,
  currentUserId
}) => {
  const [sharing, setSharing] = useState(false)
  const [gpsWatcherId, setGpsWatcherId] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const { user } = useAuth()
  
  const safeMembers = Array.isArray(members) ? members : []
  const currentUserName = user?.name || user?.Profile?.name || 'Explorer'

  // Computed Locations & Metadata
  const meetingLabel = activity?.meeting_point_label || activity?.location_name || activity?.city || 'Delhi'
  const meetingLat = Number(activity?.meeting_point_lat || activity?.latitude || 28.6139)
  const meetingLng = Number(activity?.meeting_point_lng || activity?.longitude || 77.2090)
  const destinationLabel = activity?.destination || activity?.title || 'Expedition Destination'

  const hostName = activity?.Creator?.Profile?.name || activity?.creator?.name || 'Dev Shrivastav'
  const hostAvatar = activity?.Creator?.Profile?.avatar_url || activity?.creator?.avatar_url
  const hostTrustScore = activity?.Creator?.trust_score ?? activity?.creator?.trust_score ?? 60

  // 1. Dynamic Waypoints Configuration (Ensures 3 rich expedition checkpoints)
  const generateInitialWaypoints = () => {
    const rawCheckPoints = Array.isArray(activity?.CheckInPoints) ? activity.CheckInPoints : []
    
    if (rawCheckPoints.length >= 3) {
      return rawCheckPoints.map((pt, idx) => ({
        id: pt.id || `wp_${idx}`,
        label: pt.label || `Checkpoint ${idx + 1}`,
        time: pt.scheduled_time ? new Date(pt.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `Phase ${idx + 1}`,
        confirmed: []
      }))
    }

    return [
      {
        id: 'wp_1',
        label: `Assembly & Gear Briefing (${meetingLabel})`,
        time: '06:00 AM Departure',
        confirmed: []
      },
      {
        id: 'wp_2',
        label: `Midway Trailhead & Acclimatization Halt`,
        time: '11:30 AM Enroute',
        confirmed: []
      },
      {
        id: 'wp_3',
        label: `Final Arrival & Summit Camp (${destinationLabel})`,
        time: '04:00 PM Check-in',
        confirmed: []
      }
    ]
  }

  const [waypoints, setWaypoints] = useState(() => {
    const storageKey = `troopp_checkins_${roomId || activity?.id}`
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // ignore
    }
    return generateInitialWaypoints()
  })

  // Sync to sessionStorage
  useEffect(() => {
    if (roomId || activity?.id) {
      try {
        sessionStorage.setItem(`troopp_checkins_${roomId || activity?.id}`, JSON.stringify(waypoints))
      } catch {
        // ignore
      }
    }
  }, [waypoints, roomId, activity?.id])

  // Listen for socket check-in events from other room members
  useEffect(() => {
    if (!socket) return

    const handleRemoteCheckin = (data) => {
      if (!data || data.roomId !== roomId) return
      setWaypoints((prev) =>
        prev.map((wp) => {
          if (wp.id === data.waypointId) {
            const list = Array.isArray(wp.confirmed) ? wp.confirmed : []
            if (!list.includes(data.userName)) {
              return { ...wp, confirmed: [...list, data.userName] }
            }
          }
          return wp
        })
      )
      toast.success(`📍 ${data.userName} checked in at ${data.waypointLabel || 'checkpoint'}`)
    }

    socket.on('waypoint_checkin_update', handleRemoteCheckin)
    return () => {
      socket.off('waypoint_checkin_update', handleRemoteCheckin)
    }
  }, [socket, roomId])

  // Handle local check-in
  const handleCheckIn = (waypointId) => {
    haptics.waypointCheckin?.()
    const targetWp = waypoints.find((w) => w.id === waypointId)
    const label = targetWp?.label || 'Waypoint'

    setWaypoints((prev) =>
      prev.map((wp) => {
        if (wp.id !== waypointId) return wp
        const conf = Array.isArray(wp.confirmed) ? wp.confirmed : []
        if (conf.includes(currentUserName)) return wp
        return {
          ...wp,
          confirmed: [...conf, currentUserName]
        }
      })
    )

    toast.success(`✓ Checked in at ${label}`)

    if (socket) {
      socket.emit('waypoint_checkin', {
        roomId,
        waypointId,
        waypointLabel: label,
        userId: currentUserId,
        userName: currentUserName,
        timestamp: Date.now()
      })
    }
  }

  // Live GPS Broadcast toggle
  useEffect(() => {
    if (sharing) {
      if (!('geolocation' in navigator)) {
        toast.error('Geolocation is not supported on this device.')
        setSharing(false)
        return
      }

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          }
          if (socket) {
            socket.emit('gps_location_broadcast', {
              roomId,
              userId: currentUserId,
              userName: currentUserName,
              coords,
              timestamp: Date.now()
            })
          }
        },
        (err) => {
          console.warn('GPS location tracking error:', err)
          toast.error('Unable to acquire GPS signal. Check device location permissions.')
          setSharing(false)
        },
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }
      )

      setGpsWatcherId(watchId)
      toast.success('🟢 Live GPS location broadcast active')
    } else {
      if (gpsWatcherId !== null) {
        navigator.geolocation.clearWatch(gpsWatcherId)
        setGpsWatcherId(null)
      }
    }

    return () => {
      if (gpsWatcherId !== null) {
        navigator.geolocation.clearWatch(gpsWatcherId)
      }
    }
  }, [sharing])

  // Date/Time formatting
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

  const { date: tripDateFormatted, time: tripTimeFormatted } = formatTripDate(activity?.date_time || activity?.start_date)
  const maxCapacity = activity?.max_capacity || activity?.max_group_size || 5
  const spotsLeft = Math.max(0, maxCapacity - safeMembers.length)

  // Progress metrics
  const totalCheckinsPossible = waypoints.length * (safeMembers.length || 1)
  const currentCheckinsDone = waypoints.reduce((acc, pt) => acc + (pt.confirmed?.length || 0), 0)
  const progressPercent = totalCheckinsPossible > 0 ? Math.round((currentCheckinsDone / totalCheckinsPossible) * 100) : 0

  // Google Maps Deep Link
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingLabel + ' ' + destinationLabel)}`

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-[#f3f1ea] pb-20">

      {/* =========================================================================
          LEFT COLUMN (7 cols): Meeting Point, Briefing, Organizer & GPS
          ========================================================================= */}
      <div className="lg:col-span-7 flex flex-col gap-6 min-w-0">

        {/* 1. DESIGNATED MEETING POINT */}
        <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-6 shadow-xl flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#4fbe8e] font-bold">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z"/>
                </svg>
                <span>Designated Meeting Point</span>
              </div>
              <h2 className="text-2xl font-bold text-[#f3f1ea] mt-1" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                {meetingLabel}
              </h2>
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-[#ff6a2c] bg-[#ff6a2c]/10 hover:bg-[#ff6a2c]/20 border border-[#ff6a2c]/30 px-4 py-2.5 rounded-full transition-all flex-shrink-0 cursor-pointer shadow-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              </svg>
              <span>Open in Google Maps</span>
            </a>
          </div>

          {/* Interactive Route & Topographic Canvas */}
          <div className="relative h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-[#10151a] via-[#151c24] to-[#0c1013] border border-white/10 flex items-center justify-center p-6">
            {/* Topographic Background Contours */}
            <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="0 0 600 240" preserveAspectRatio="none">
              <path d="M0,190 Q150,120 300,170 T600,140" stroke="#4fbe8e" strokeWidth="1.5" fill="none" />
              <path d="M0,140 Q180,70 360,120 T600,90" stroke="#4fbe8e" strokeWidth="1.2" fill="none" />
              <path d="M0,220 Q200,170 400,205 T600,180" stroke="#ff6a2c" strokeWidth="1.2" fill="none" opacity="0.6" />
              <path d="M0,90 Q220,40 440,80 T600,50" stroke="#4fbe8e" strokeWidth="0.8" strokeDasharray="4 4" fill="none" opacity="0.4" />
            </svg>

            {/* Connecting Trail Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 240" preserveAspectRatio="none">
              <path d="M 120 160 Q 300 70 480 110" stroke="#ff6a2c" strokeWidth="3" strokeDasharray="6 6" fill="none" />
            </svg>

            {/* Start Pin */}
            <div className="absolute left-[15%] bottom-[20%] flex flex-col items-center z-10">
              <div className="w-9 h-9 rounded-full bg-[#4fbe8e] flex items-center justify-center shadow-[0_0_0_8px_rgba(79,190,142,0.25)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10151a" strokeWidth="3">
                  <circle cx="12" cy="12" r="4"/>
                </svg>
              </div>
              <span className="text-[11px] font-bold text-[#4fbe8e] bg-[#10151a]/95 px-3 py-1 rounded-full border border-[#4fbe8e]/30 mt-1.5 backdrop-blur-sm whitespace-nowrap shadow-md">
                Start: {meetingLabel}
              </span>
            </div>

            {/* Destination Pin */}
            <div className="absolute right-[15%] top-[18%] flex flex-col items-center z-10">
              <div className="w-10 h-10 rounded-t-full rounded-bl-full bg-[#ff6a2c] -rotate-45 flex items-center justify-center shadow-[0_0_0_10px_rgba(255,106,44,0.3)] animate-pulse">
                <svg className="rotate-45 w-5 h-5 fill-[#10151a]" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8"/>
                </svg>
              </div>
              <span className="text-[11px] font-bold text-[#ff6a2c] bg-[#10151a]/95 px-3 py-1 rounded-full border border-[#ff6a2c]/30 mt-1.5 backdrop-blur-sm whitespace-nowrap shadow-md">
                {destinationLabel}
              </span>
            </div>

            {/* Coordinates Badge */}
            <div className="absolute bottom-3 left-3 font-mono text-[11px] text-[#9ba6ad] bg-[#0c1013]/90 px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4fbe8e] animate-pulse" />
              <span>{meetingLat.toFixed(4)}° N, {meetingLng.toFixed(4)}° E</span>
            </div>
          </div>

          <p className="text-sm text-[#9ba6ad] leading-relaxed m-0">
            Assemble at this coordinate pin at the designated departure time. Confirmed travelers verify arrival via the live checkpoint tracker.
          </p>
        </div>

        {/* 2. EXPEDITION BRIEFING & ROUTE */}
        <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-6 shadow-xl flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#4fbe8e] font-bold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0 0 21 18.618V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
              <span>Expedition Briefing &amp; Route</span>
            </div>
            <h2 className="text-2xl font-bold text-[#f3f1ea] mt-1" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
              {destinationLabel}
            </h2>
          </div>

          {/* 3-Column Stat Grid (Generous width and no clipped borders) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-[#10151a] border border-white/10 rounded-2xl p-4 flex flex-col justify-between min-h-[96px]">
              <div className="flex items-center gap-2 text-[11px] text-[#9ba6ad] uppercase font-bold tracking-wider font-mono">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                <span>Departure</span>
              </div>
              <div className="mt-2">
                <div className="font-bold text-[15px] text-[#f3f1ea]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                  {tripDateFormatted}
                </div>
                <div className="text-xs text-[#9ba6ad] mt-0.5">{tripTimeFormatted}</div>
              </div>
            </div>

            <div className="bg-[#10151a] border border-white/10 rounded-2xl p-4 flex flex-col justify-between min-h-[96px]">
              <div className="flex items-center gap-2 text-[11px] text-[#9ba6ad] uppercase font-bold tracking-wider font-mono">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <span>Estimated Budget</span>
              </div>
              <div className="mt-2">
                <div className="font-bold text-[16px] text-[#4fbe8e]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                  ₹{Number(activity?.cost_per_person || activity?.cost_estimate || 15000).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-[#9ba6ad] mt-0.5">per traveler</div>
              </div>
            </div>

            <div className="bg-[#10151a] border border-white/10 rounded-2xl p-4 flex flex-col justify-between min-h-[96px]">
              <div className="flex items-center gap-2 text-[11px] text-[#9ba6ad] uppercase font-bold tracking-wider font-mono">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
                <span>Group Capacity</span>
              </div>
              <div className="mt-2">
                <div className="font-bold text-[15px] text-[#f3f1ea]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                  {safeMembers.length} of {maxCapacity} spots
                </div>
                <div className="text-xs text-[#ff6a2c] font-bold mt-0.5">
                  {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left` : 'Fully booked'}
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Trail Directives Card */}
          <div className="p-5 bg-[#10151a] rounded-2xl border border-white/10 flex flex-col gap-2">
            <div className="text-xs text-[#4fbe8e] uppercase font-mono font-bold tracking-wider">
              Expedition Notes &amp; Trail Directives
            </div>
            <p className="text-sm text-[#f3f1ea] leading-relaxed m-0 font-medium">
              {activity?.description || 'Trail briefing: Pack cold-weather layers, emergency headlamps, and personal hydration gear. Keep offline maps downloaded.'}
            </p>
          </div>
        </div>

        {/* 3. LEAD ORGANIZER & GPS BROADCAST */}
        <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-6 shadow-xl flex flex-col gap-5">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#4fbe8e] font-bold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M12 1v6M12 17v6M4.2 4.2l4.2 4.2M15.6 15.6l4.2 4.2M1 12h6M17 12h6M4.2 19.8l4.2-4.2M15.6 8.4l4.2-4.2"/>
            </svg>
            <span>Lead Organizer &amp; Host</span>
          </div>

          <div className="flex items-center gap-4 bg-[#10151a] p-4 rounded-2xl border border-white/10">
            <Avatar
              src={hostAvatar}
              name={hostName}
              size="md"
              score={hostTrustScore}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[#f3f1ea]" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                  {hostName}
                </span>
                <span className="w-4 h-4 rounded-full bg-[#4fbe8e] flex items-center justify-center flex-shrink-0" title="Verified Host">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10151a" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
              </div>
              <div className="text-xs text-[#9ba6ad] mt-0.5 flex items-center gap-2">
                <span>Verified Expedition Host</span>
                <span>·</span>
                <span className="text-[#4fbe8e] font-mono font-bold">★ {hostTrustScore}/100 Trust Score</span>
              </div>
            </div>
          </div>

          {/* Live GPS Broadcast Switch */}
          <div className="flex items-center justify-between gap-4 p-4 bg-[#10151a] rounded-2xl border border-white/10">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                sharing ? 'bg-[#ff6a2c]/20 text-[#ff6a2c]' : 'bg-[#1a2129] text-[#9ba6ad] border border-white/10'
              }`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                </svg>
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-[#f3f1ea]">Live GPS Location Broadcast</div>
                <div className="text-xs text-[#9ba6ad] mt-0.5 truncate">
                  {sharing ? '🟢 Broadcasting live coordinates to fellow travelers' : 'Share real-time coordinates with confirmed members'}
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
                sharing ? 'bg-[#ff6a2c]' : 'bg-[#1a2129] border border-white/10'
              }`} />
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
                sharing ? 'transform translate-x-5' : ''
              }`} />
            </label>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN (5 cols): Confirmed Travelers Roster & Checkpoint Tracker
          ========================================================================= */}
      <div className="lg:col-span-5 flex flex-col gap-6 min-w-0">

        {/* 1. TRAVELER ROSTER */}
        <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#4fbe8e] font-bold">
                Traveler Roster
              </div>
              <h3 className="text-lg font-bold text-[#f3f1ea] mt-0.5" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                Confirmed Members ({safeMembers.length})
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4fbe8e] bg-[#4fbe8e]/10 px-3 py-1 rounded-full uppercase tracking-wider flex-shrink-0 border border-[#4fbe8e]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4fbe8e] animate-pulse" />
              <span>Active</span>
            </div>
          </div>

          {/* Member List */}
          <div className="flex flex-col gap-2.5">
            {safeMembers.map((m) => {
              const rawName = m?.name || m?.User?.Profile?.name || 'Explorer'
              const isCurrentUser = m?.userId === user?.id || m?.id === user?.id
              const score = m.trustScore ?? m.User?.trust_score ?? 60
              const isHostMember = m?.isHost || m?.role === 'host' || m?.userId === activity?.creator_id

              return (
                <div
                  key={m.userId || m.id || rawName}
                  onClick={() => setSelectedMember(m)}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#10151a] border border-white/5 hover:border-white/15 transition-all cursor-pointer shadow-sm"
                >
                  <Avatar
                    src={m.avatarUrl || m.User?.Profile?.avatar_url}
                    name={rawName}
                    size="sm"
                    score={score}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[#f3f1ea] flex items-center gap-2 truncate">
                      <span className="truncate">{rawName}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] text-[#ff6a2c] bg-[#ff6a2c]/10 px-2 py-0.5 rounded-full font-bold border border-[#ff6a2c]/20 flex-shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#9ba6ad] mt-0.5 truncate">
                      {isHostMember ? '👑 Verified Expedition Host' : 'Verified Explorer'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#4fbe8e] bg-[#4fbe8e]/10 px-2.5 py-1 rounded-full flex-shrink-0 border border-[#4fbe8e]/20">
                    <span>★</span>
                    <span>{score}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 2. EXPEDITION CHECKPOINTS (LIVE TRACKER) */}
        <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#4fbe8e] font-bold">
                Expedition Checkpoints
              </div>
              <h3 className="text-lg font-bold text-[#f3f1ea] mt-0.5" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                Check-In Waypoints
              </h3>
            </div>
            <span className="text-[11px] font-bold text-[#ff6a2c] bg-[#ff6a2c]/10 px-3 py-1 rounded-full uppercase tracking-wider flex-shrink-0 border border-[#ff6a2c]/20">
              Live Tracker
            </span>
          </div>

          {/* Progress Summary */}
          <div className="flex flex-col gap-2">
            <div className="text-xs text-[#9ba6ad]">
              <b className="text-[#f3f1ea]">{currentCheckinsDone}</b> of {totalCheckinsPossible} check-ins confirmed across the trail
            </div>
            <div className="h-2 bg-[#10151a] rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-[#ff6a2c] to-[#4fbe8e] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Waypoint Timeline Items */}
          <div className="relative pl-1 flex flex-col gap-5 mt-2">
            {/* Vertical stem */}
            <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-white/10 z-0" />

            {waypoints.map((pt, idx) => {
              const isCheckedIn = pt.confirmed?.includes(currentUserName)
              const isDone = pt.confirmed?.length >= (safeMembers.length || 1)
              const isPartial = pt.confirmed?.length > 0 && !isDone

              return (
                <div key={pt.id} className="relative flex gap-3.5 z-10">
                  {/* Node Circle */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 transition-all ${
                    isDone
                      ? 'bg-[#4fbe8e] text-[#10151a] border-2 border-[#4fbe8e] shadow-lg shadow-[#4fbe8e]/20'
                      : isPartial
                      ? 'bg-[#ff6a2c]/20 text-[#ff6a2c] border-2 border-[#ff6a2c] shadow-lg shadow-[#ff6a2c]/20'
                      : 'bg-[#10151a] text-[#9ba6ad] border-2 border-white/10'
                  }`}>
                    {isDone ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Content Container */}
                  <div className="flex-1 min-w-0 bg-[#10151a] p-3.5 rounded-2xl border border-white/5 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-[#f3f1ea] leading-snug truncate" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                          {pt.label}
                        </div>
                        <div className="text-xs text-[#9ba6ad] font-mono mt-0.5">
                          {pt.time} · <span className="text-[#4fbe8e] font-bold">{pt.confirmed?.length || 0}/{safeMembers.length || 1}</span> verified
                        </div>
                      </div>

                      {isCheckedIn ? (
                        <button
                          disabled
                          className="text-xs font-bold text-[#4fbe8e] bg-[#4fbe8e]/10 border border-[#4fbe8e]/30 px-3.5 py-1.5 rounded-full flex-shrink-0 text-center shadow-sm"
                        >
                          Checked in ✓
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCheckIn(pt.id)}
                          className="text-xs font-bold bg-gradient-to-r from-[#ff6a2c] to-[#d9481a] hover:opacity-90 text-[#1a0e08] px-4 py-1.5 rounded-full transition-all flex-shrink-0 cursor-pointer active:scale-95 text-center shadow-md shadow-[#ff6a2c]/25"
                        >
                          Check in
                        </button>
                      )}
                    </div>

                    {pt.confirmed?.length > 0 && (
                      <div className="text-xs text-[#9ba6ad] pt-1 border-t border-white/5 truncate">
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

      {/* Member Profile Drawer Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#1a2129] border border-white/10 rounded-[24px] p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 relative"
            >
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 text-[#9ba6ad] hover:text-[#f3f1ea] text-sm font-bold w-8 h-8 rounded-full bg-[#10151a] flex items-center justify-center border border-white/10 cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-3.5">
                <Avatar
                  src={selectedMember.avatarUrl || selectedMember.User?.Profile?.avatar_url}
                  name={selectedMember.name || selectedMember.User?.Profile?.name || 'Explorer'}
                  size="lg"
                  score={selectedMember.trustScore ?? selectedMember.User?.trust_score ?? 60}
                />
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-[#f3f1ea] truncate" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                    {selectedMember.name || selectedMember.User?.Profile?.name || 'Explorer'}
                  </h4>
                  <div className="text-xs text-[#4fbe8e] font-mono font-bold mt-0.5">
                    ★ {selectedMember.trustScore ?? selectedMember.User?.trust_score ?? 60}/100 Trust Score
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[#10151a] rounded-2xl border border-white/5 text-xs text-[#9ba6ad] leading-relaxed">
                {selectedMember.bio || selectedMember.User?.Profile?.bio || 'Verified expedition traveler. Active co-explorer in Troopp travel network.'}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/profile/${selectedMember.userId || selectedMember.id}`}
                  className="flex-1 h-10 rounded-full bg-[#ff6a2c] hover:bg-[#d9481a] text-[#1a0e08] font-bold text-xs flex items-center justify-center transition-all shadow-md shadow-[#ff6a2c]/20"
                >
                  View Full Profile
                </Link>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="h-10 px-5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#f3f1ea] transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default InfoTab
export { InfoTab }
