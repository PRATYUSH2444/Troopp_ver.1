import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform, animate } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from '../components/common/Avatar.jsx'
import Spinner from '../components/common/Spinner.jsx'
import { haptics } from '../utils/haptics.js'

const INTENTS = ['Driver 🚗', 'Cook 🍳', 'Photographer 📸', 'Navigator 🗺️', 'Camp Helper 🏕️', 'Mediator 🗣️']

const ActivityDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Real, dynamic states returned by getByIdWithDetails
  const [activity, setActivity] = useState(null)
  const [confirmedMembers, setConfirmedMembers] = useState([])
  const [mutualConnections, setMutualConnections] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [showIntentModal, setShowIntentModal] = useState(false)
  const [selectedIntent, setSelectedIntent] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fillPct, setFillPct] = useState(0)

  const [isBackHovered, setIsBackHovered] = useState(false)
  const [isCtaHovered, setIsCtaHovered] = useState(false)
  const [hoveredRole, setHoveredRole] = useState(null)

  // Circular capacity calculation based on real confirmed traveler counts
  useEffect(() => {
    if (!activity) return
    const spotsTaken = confirmedMembers?.length || 0
    const maxCapacity = activity.max_group_size || activity.max_capacity || 5
    const targetPct = (spotsTaken / maxCapacity) * 100
    
    animate(0, targetPct, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (latest) => setFillPct(latest)
    })
  }, [activity, confirmedMembers])

  const { scrollY } = useScroll()
  const coverY = useTransform(scrollY, [0, 400], [0, 160])

  const loadActivity = async () => {
    try {
      const res = await apiRequest(`/activities/${id}`)
      if (res.ok) {
        const json = await res.json()
        // Extract real properties from matching backend getByIdWithDetails return format
        setActivity(json.data.activity)
        setConfirmedMembers(json.data.confirmedMembers || [])
        setMutualConnections(json.data.mutualConnections || [])
      } else {
        throw new Error('Activity not found')
      }
    } catch (err) {
      toast.error('Failed to load trip details.')
      navigate('/feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivity()
  }, [id])

  const handleJoinRequest = async () => {
    if (!selectedIntent) {
      return toast.error('Please select your role intent first.')
    }

    setSubmitting(true)
    haptics.lightTap()
    try {
      const res = await apiRequest(`/activities/${id}/requests`, {
        method: 'POST',
        body: JSON.stringify({
          roleIntent: selectedIntent,
          message: message.trim()
        })
      })

      const data = await res.json()
      if (res.ok) {
        haptics.success()
        toast.success(data.message || 'Join request dispatched successfully!')
        setShowIntentModal(false)
        await loadActivity() // Refresh slots/waitlist status
      } else {
        throw new Error(data.error?.message || 'Failed to submit join request.')
      }
    } catch (err) {
      haptics.error()
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#10151a' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!activity) return null

  // Real host & traveler validation flags
  const isHost = user?.id === activity.creator_id
  const isConfirmedMember = confirmedMembers?.some((m) => m.user_id === user?.id)
  const spotsTaken = confirmedMembers?.length || 0
  const maxCapacity = activity.max_group_size || activity.max_capacity || 5
  const spotsLeft = Math.max(0, maxCapacity - spotsTaken)

  const hostScore = activity.Creator?.trust_score ?? activity.Creator?.trustScore ?? 0

  const getHostBadge = () => {
    if (hostScore >= 75) return { label: '👑 Trusted Host', color: '#4fbe8e' }
    if (hostScore >= 50) return { label: '🛡️ Verified Host', color: '#3b82f6' }
    return { label: '🌱 New Host', color: '#6b757c' }
  }
  const hostBadge = getHostBadge()

  // Safety checks for traveler
  const isReliabilityTooLow = user?.reliabilityScore !== undefined && user.reliabilityScore < 70

  const fallbackCovers = {
    trek: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    road_trip: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    cycling: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
    night_drive: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=80',
    camping: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80',
    heritage_walk: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
    photography_walk: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
    day_trip: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80'
  }
  const coverUrl = fallbackCovers[activity.type] || fallbackCovers.day_trip

  // Dynamic calculation of Gender Ratio from real confirmed traveler profile records
  const getDynamicGenderComposition = () => {
    const total = confirmedMembers.length
    if (total === 0) return { maleRatio: 0, femaleRatio: 0, otherRatio: 0 }

    let fCount = 0
    let mCount = 0
    confirmedMembers.forEach((m) => {
      const gender = (m.User?.Profile?.gender || '').toLowerCase()
      if (gender === 'female' || gender === 'f') fCount++
      else if (gender === 'male' || gender === 'm') mCount++
    })

    const mRatio = Math.round((mCount / total) * 100)
    const fRatio = Math.round((fCount / total) * 100)
    const oRatio = 100 - mRatio - fRatio

    return { maleRatio: mRatio, femaleRatio: fRatio, otherRatio: oRatio }
  }

  const { maleRatio, femaleRatio, otherRatio } = getDynamicGenderComposition()

  return (
    <div className="page-container-medium">
      {/* Back Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', userSelect: 'none' }}>
        <button
          onClick={() => {
            haptics.lightTap()
            navigate(-1)
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
      </div>

      {/* 2 Column Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start w-full">
        
        {/* Left Main Details Column */}
        <div className="flex flex-col gap-5 w-full min-w-0">
            
            {/* Cover Banner & Details Card */}
            <div
              style={{
                background: '#1a2129',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              {/* Media banner */}
              <div style={{ height: '320px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                <motion.img
                  layoutId={`activity-image-${activity.id}`}
                  src={coverUrl}
                  alt={activity.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', y: coverY }}
                />
                {/* Vibe badge overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    background: 'rgba(16,21,26,0.72)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#f3f1ea',
                    fontSize: '11px',
                    fontWeight: '600',
                    padding: '6px 12px',
                    borderRadius: '100px'
                  }}
                >
                  {activity.vibe_score_tag || '🌍 Weekend Explorer'}
                </div>
                {/* Gradient shade */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(0deg, rgba(16,21,26,0.9) 0%, transparent 60%)'
                  }}
                />
              </div>

              {/* Text contents body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      background: 'rgba(255,106,44,0.14)',
                      color: '#ff6a2c',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      padding: '6px 12px',
                      borderRadius: '100px',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {activity.type?.replace('_', ' ') || 'TRAVEL'}
                  </span>
                  
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#ff6a2c',
                      background: 'rgba(255,106,44,0.08)',
                      border: '1px solid rgba(255,106,44,0.14)',
                      padding: '4px 12px',
                      borderRadius: '8px'
                    }}
                  >
                    {activity.cost_per_person === 0 ? 'Free' : `₹${Math.round(activity.cost_per_person)}`}
                  </span>
                </div>

                <h1
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#f3f1ea',
                    lineHeight: '1.2',
                    letterSpacing: '-0.02em',
                    margin: 0
                  }}
                >
                  {activity.title}
                </h1>

                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#9ba6ad',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>📅</span>
                  <span>{new Date(activity.date_time).toLocaleString()}</span>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                  <p
                    style={{
                      fontSize: '14.5px',
                      color: '#9ba6ad',
                      lineHeight: '1.7',
                      margin: 0,
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {activity.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Safety Rules Panel */}
            {activity.rules && (
              <div
                style={{
                  background: '#1a2129',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#6b757c', margin: 0, letterSpacing: '0.04em' }}>
                  🔒 Group Safety Rules
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: activity.rules.no_smoking ? 'rgba(79,190,142,0.14)' : 'rgba(255,84,112,0.14)',
                      color: activity.rules.no_smoking ? '#4fbe8e' : '#ff5470',
                      fontSize: '12.5px',
                      fontWeight: '600'
                    }}
                  >
                    🚭 No Smoking: {activity.rules.no_smoking ? 'Yes' : 'No'}
                  </div>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: activity.rules.pets_allowed ? 'rgba(79,190,142,0.14)' : 'rgba(255,84,112,0.14)',
                      color: activity.rules.pets_allowed ? '#4fbe8e' : '#ff5470',
                      fontSize: '12.5px',
                      fontWeight: '600'
                    }}
                  >
                    🐾 Pets Allowed: {activity.rules.pets_allowed ? 'Yes' : 'No'}
                  </div>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: activity.rules.alcohol_allowed ? 'rgba(79,190,142,0.14)' : 'rgba(255,84,112,0.14)',
                      color: activity.rules.alcohol_allowed ? '#4fbe8e' : '#ff5470',
                      fontSize: '12.5px',
                      fontWeight: '600'
                    }}
                  >
                    🍻 Alcohol Allowed: {activity.rules.alcohol_allowed ? 'Yes' : 'No'}
                  </div>
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: activity.rules.music_allowed ? 'rgba(79,190,142,0.14)' : 'rgba(255,84,112,0.14)',
                      color: activity.rules.music_allowed ? '#4fbe8e' : '#ff5470',
                      fontSize: '12.5px',
                      fontWeight: '600'
                    }}
                  >
                    🪕 Music Allowed: {activity.rules.music_allowed ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            )}

            {/* Confirmed Travelers List */}
            <div
              style={{
                background: '#1a2129',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#6b757c', margin: 0, letterSpacing: '0.04em' }}>
                👥 Confirmed Travelers ({spotsTaken})
              </h3>
              
              {confirmedMembers?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {confirmedMembers.map((member) => {
                    const memberScore = member.User?.trust_score ?? member.User?.trustScore ?? 50
                    const memberColor = memberScore >= 75 ? '#4fbe8e' : memberScore >= 50 ? '#3b82f6' : '#6b757c'
                    const memberLabel = memberScore >= 75 ? '👑 Trusted' : memberScore >= 50 ? '🛡️ Member' : '🌱 New'

                    return (
                      <Link
                        key={member.id}
                        to={`/profile/${member.User?.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 14px',
                          background: '#212b33',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '14px',
                          transition: 'all 150ms ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
                          e.currentTarget.style.background = '#252f39'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                          e.currentTarget.style.background = '#212b33'
                        }}
                      >
                        <Avatar
                          src={member.User?.Profile?.avatar_url}
                          name={member.User?.Profile?.name || 'Explorer'}
                          size="sm"
                          showBadge
                          score={memberScore}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#f3f1ea' }}>
                            {member.User?.Profile?.name || 'Traveler'}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: '700', color: memberColor, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            {memberLabel}: {memberScore}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#6b757c', fontStyle: 'italic', margin: 0 }}>No travelers joined yet.</p>
              )}
            </div>
          </div>

          {/* Right Host & Join Side Panel Column */}
          <div className="flex flex-col gap-5 w-full min-w-0 lg:sticky lg:top-6">
            
            {/* Host Details Card */}
            <div
              style={{
                background: '#1a2129',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '16px'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Hosted By
              </span>
              <motion.div layoutId={`activity-avatar-${activity.Creator?.id}`}>
                <Avatar
                  src={activity.Creator?.Profile?.avatar_url}
                  name={activity.Creator?.Profile?.name || 'Host'}
                  size="lg"
                  showBadge
                  score={activity.Creator?.trust_score || 80}
                />
              </motion.div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#f3f1ea', margin: 0 }}>
                  {activity.Creator?.Profile?.name || 'Verified Host'}
                </h4>
                <motion.span
                  layoutId={`activity-trust-${activity.id}`}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: hostBadge.color,
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }}
                >
                  {hostBadge.label}: {hostScore} PTS
                </motion.span>
              </div>
              
              <Link
                to={`/profile/${activity.creator_id}`}
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#ff6a2c',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                View Host Details
              </Link>
            </div>

            {/* Join Check Gate Card */}
            <div
              style={{
                background: '#1a2129',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#6b757c', margin: 0, letterSpacing: '0.04em' }}>
                Trip Openings
              </h3>

              {/* Circular Capacity Donut Chart */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '20px',
                  background: '#0c1013',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  gap: '16px'
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Slots Availability
                </span>
                
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    background: `conic-gradient(#ff6a2c ${fillPct * 3.6}deg, #212b33 0deg)`,
                    transition: 'background 300ms ease'
                  }}
                >
                  <div
                    style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '50%',
                      background: '#1a2129',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      userSelect: 'none'
                    }}
                  >
                    <span style={{ fontSize: '24px', fontWeight: '700', color: '#f3f1ea' }}>
                      {spotsLeft}
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: '600', color: '#9ba6ad', textTransform: 'uppercase', marginTop: '4px' }}>
                      {spotsLeft === 1 ? 'slot left' : 'slots left'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Gender Composition Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-tertiary)', fontWeight: '600' }}>
                  <span>Composition</span>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {maleRatio}% M · {femaleRatio}% F
                  </span>
                </div>
                <div style={{ height: '8px', borderRadius: '100px', overflow: 'hidden', display: 'flex', background: '#212b33' }}>
                  <div style={{ width: `${femaleRatio}%`, background: '#e0668f' }} />
                  <div style={{ width: `${maleRatio}%`, background: '#5b8fd6' }} />
                  <div style={{ width: `${otherRatio}%`, background: '#212b33' }} />
                </div>
              </div>

              {isHost ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                  <div style={{ background: '#212b33', border: '1px solid rgba(255,255,255,0.08)', padding: '12px', borderRadius: '12px', textAlign: 'center', fontSize: '12.5px', fontWeight: '600', color: '#9ba6ad' }}>
                    You are hosting this activity.
                  </div>
                  <Link
                    to={`/trip-rooms/${activity.id}`}
                    style={{
                      height: '46px',
                      background: 'rgba(255,106,44,0.14)',
                      color: '#ff6a2c',
                      borderRadius: '100px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      fontFamily: 'Space Grotesk, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      transition: 'background 150ms'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,106,44,0.24)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255,106,44,0.14)'}
                  >
                    Enter Trip Room 💬
                  </Link>
                </div>
              ) : isConfirmedMember ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                  <div style={{ background: 'rgba(79,190,142,0.14)', border: '1px solid rgba(79,190,142,0.25)', padding: '12px', borderRadius: '12px', textAlign: 'center', fontSize: '12.5px', fontWeight: '600', color: '#4fbe8e' }}>
                    ✓ You are a confirmed traveler!
                  </div>
                  <Link
                    to={`/trip-rooms/${activity.id}`}
                    style={{
                      height: '46px',
                      background: 'rgba(255,106,44,0.14)',
                      color: '#ff6a2c',
                      borderRadius: '100px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      fontFamily: 'Space Grotesk, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      transition: 'background 150ms'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,106,44,0.24)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255,106,44,0.14)'}
                  >
                    Enter Trip Room 💬
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                  {isReliabilityTooLow ? (
                    <div style={{ background: 'rgba(255,84,112,0.14)', border: '1px solid rgba(255,84,112,0.25)', padding: '12px', borderRadius: '12px' }}>
                      <p style={{ fontSize: '11px', color: '#ff5470', margin: 0, fontWeight: '600', lineHeight: '1.4' }}>
                        🔴 Access Denied: Your reliability score ({user?.reliabilityScore}%) is below the platform threshold.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        haptics.lightTap()
                        setShowIntentModal(true)
                      }}
                      onMouseEnter={() => setIsCtaHovered(true)}
                      onMouseLeave={() => setIsCtaHovered(false)}
                      style={{
                        width: '100%',
                        height: '46px',
                        background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                        color: '#1a0e08',
                        border: 'none',
                        borderRadius: '100px',
                        fontSize: '13.5px',
                        fontWeight: '700',
                        fontFamily: 'Space Grotesk, sans-serif',
                        cursor: 'pointer',
                        boxShadow: isCtaHovered ? '0 6px 18px rgba(255,106,44,0.35)' : '0 4px 12px rgba(255,106,44,0.20)',
                        transform: isCtaHovered ? 'translateY(-1px)' : 'translateY(0)',
                        transition: 'all 150ms ease'
                      }}
                    >
                      {spotsLeft > 0 ? 'Request to Join' : 'Join Waitlist'}
                    </button>
                  )}
                </div>
              )}
          </div>

        </div>

      </div>

      {/* Join Intent Picker Modal Overlay */}
      <AnimatePresence>
        {showIntentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(16,21,26,0.6)',
              backdropFilter: 'blur(6px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                width: '100%',
                maxWidth: '420px',
                background: '#1a2129',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: '#f3f1ea', margin: 0 }}>
                  Select Your Intent Role
                </h3>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                  How will you add value to the group?
                </p>
              </div>

              {/* Role Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {INTENTS.map((role) => {
                  const isActive = selectedIntent === role
                  const isHovered = hoveredRole === role
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        haptics.lightTap()
                        setSelectedIntent(role)
                      }}
                      onMouseEnter={() => setHoveredRole(role)}
                      onMouseLeave={() => setHoveredRole(null)}
                      style={{
                        height: '44px',
                        padding: '0 12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: isActive ? 'linear-gradient(135deg, #ff6a2c, #d9481a)' : '#212b33',
                        color: isActive ? '#1a0e08' : '#9ba6ad',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: isActive ? '0 4px 12px rgba(255,106,44,0.25)' : 'none',
                        transform: isHovered && !isActive ? 'scale(1.02)' : 'scale(1)',
                        transition: 'all 150ms ease'
                      }}
                    >
                      {role}
                    </button>
                  )
                })}
              </div>

              {/* Message introduction textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#9ba6ad' }}>
                  Introduction message (optional)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hey, I would love to join your weekend trek!..."
                  style={{
                    width: '100%',
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '13px',
                    color: '#f3f1ea',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    haptics.lightTap()
                    setShowIntentModal(false)
                  }}
                  style={{
                    flex: 1,
                    height: '44px',
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '100px',
                    color: '#9ba6ad',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.04)'
                    e.target.style.color = '#f3f1ea'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'none'
                    e.target.style.color = '#9ba6ad'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleJoinRequest}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    height: '44px',
                    background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                    color: '#1a0e08',
                    border: 'none',
                    borderRadius: '100px',
                    fontSize: '13px',
                    fontWeight: '700',
                    fontFamily: 'Space Grotesk, sans-serif',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(255,106,44,0.20)',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? 'Submitting...' : 'Send Request'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ActivityDetail
export { ActivityDetail }
