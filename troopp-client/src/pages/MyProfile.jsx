import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useScroll } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from '../components/common/Avatar.jsx'
import { ProfileSkeleton } from '../components/common/Skeleton.jsx'
import confetti from 'canvas-confetti'
import TrustCircle from '../components/trust/TrustCircle.jsx'
import { haptics } from '../utils/haptics.js'

const HISTORY_CACHE_KEY = 'troopp_milestone_celebrated'

const MyProfile = () => {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [myActivities, setMyActivities] = useState([])
  const { user } = useAuth()
  const navigate = useNavigate()
  const [milestone, setMilestone] = useState(null)
  const [activeTab, setActiveTab] = useState('hosted') // 'hosted' or 'attended'
  
  const [isCogHovered, setIsCogHovered] = useState(false)
  const [hoveredLogId, setHoveredLogId] = useState(null)
  const [hoveredTripId, setHoveredTripId] = useState(null)
  const [isVerifyHovered, setIsVerifyHovered] = useState(false)

  const { scrollY } = useScroll()
  const [isCompressed, setIsCompressed] = useState(false)

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setIsCompressed(latest > 120)
    })
  }, [scrollY])

  const [showBottomSheet, setShowBottomSheet] = useState(false)

  const MOCK_TRUST_CHANGES = [
    { id: 1, type: 'increase', amount: 15, reason: 'ID Verification Complete', date: '2026-07-06', icon: '🛡️' },
    { id: 2, type: 'increase', amount: 10, reason: 'Completed first group trip', date: '2026-07-05', icon: '🚗' },
    { id: 3, type: 'increase', amount: 5, reason: 'Received 5-star host rating', date: '2026-07-02', icon: '⭐' },
    { id: 4, type: 'increase', amount: 5, reason: 'KYC Face Matching Success', date: '2026-06-30', icon: '👩' },
    { id: 5, type: 'increase', amount: 5, reason: 'Verified phone number linking', date: '2026-06-25', icon: '📱' },
    { id: 6, type: 'increase', amount: 5, reason: 'Verified email address linking', date: '2026-06-25', icon: '📧' },
    { id: 7, type: 'increase', amount: 3, reason: 'Added emergency contacts list', date: '2026-06-25', icon: '🚨' },
    { id: 8, type: 'increase', amount: 2, reason: 'Created traveler profile info', date: '2026-06-25', icon: '📝' }
  ]

  // Sync profile milestone achievements
  useEffect(() => {
    if (!profileData) return
    const profileObj = profileData.profile ?? {}
    const tripsCount = profileObj.trips_completed ?? 0
    const allowedMilestones = [1, 5, 10, 25]
    if (allowedMilestones.includes(tripsCount)) {
      const key = `troopp_milestone_celebrated_${tripsCount}`
      const alreadyCelebrated = localStorage.getItem(key)
      if (!alreadyCelebrated) {
        setMilestone(tripsCount)
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.2 }
          })
        }, 300)
      }
    }
  }, [profileData])

  useEffect(() => {
    const loadProfileAndTrips = async () => {
      try {
        const profileRes = await apiRequest('/profiles/me')
        if (!profileRes.ok) {
          throw new Error('Failed to retrieve profile information.')
        }
        const profileJson = await profileRes.json()
        setProfileData(profileJson.data)

        const activitiesRes = await apiRequest('/activities')
        if (activitiesRes.ok) {
          const activitiesJson = await activitiesRes.json()
          setMyActivities(activitiesJson.data.activities || activitiesJson.data || [])
        }
      } catch (err) {
        toast.error(err.message || 'Error loading profile details.')
      } finally {
        setLoading(false)
      }
    }
    loadProfileAndTrips()
  }, [])

  if (loading) {
    return <ProfileSkeleton />
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#10151a' }}>
        <p className="text-sm font-semibold text-text-secondary">Failed to load profile details.</p>
      </div>
    )
  }

  // Crash-safe fallback destructuring from profileData API keys
  const trustScore = profileData.trustScore ?? profileData.trust_score ?? 0
  const reliabilityScore = profileData.reliabilityScore ?? profileData.reliability_score ?? 100
  const idVerified = profileData.idVerified ?? profileData.id_verified ?? false
  const interestTags = profileData.interestTags ?? profileData.interest_tags ?? []
  const profile = profileData.profile ?? {}
  
  // Filter hosted & joined activities
  const hostedTrips = myActivities.filter((a) => a.creator_id === user?.id)
  const joinedTrips = myActivities.filter((a) => a.creator_id !== user?.id && a.status === 'completed')

  const milestoneTexts = {
    1: { title: "First Trip!", desc: "You went on your first trip! 🎉", style: "from-orange-500 to-rose-500" },
    5: { title: "Explorer!", desc: "You are now an Explorer! 🥾", style: "from-blue-500 to-indigo-500" },
    10: { title: "Seasoned Traveler!", desc: "You are now a Seasoned Traveler! ✈️", style: "from-emerald-500 to-teal-500" },
    25: { title: "Troopp Legend!", desc: "You are now a Troopp Legend! 👑", style: "from-amber-500 to-yellow-600" }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#10151a', paddingBottom: '96px' }}>
      
      {/* Sliding Milestone Banner */}
      <AnimatePresence>
        {milestone && milestoneTexts[milestone] && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            className={`w-full max-w-3xl mx-auto p-4 text-white relative shadow-lg overflow-hidden flex flex-col items-center justify-center text-center gap-1 bg-gradient-to-r rounded-2xl mb-6 ${milestoneTexts[milestone].style}`}
          >
            <button
              onClick={() => {
                localStorage.setItem(`troopp_milestone_celebrated_${milestone}`, 'true')
                setMilestone(null)
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                width: '28px',
                height: '28px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '12px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
            <span style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '100px' }}>
              Achievement Unlocked: {milestoneTexts[milestone].title}
            </span>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '14px', margin: 0 }}>
              {milestoneTexts[milestone].desc}
            </h3>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Compressed Header */}
      <AnimatePresence>
        {isCompressed && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              background: 'rgba(26, 33, 41, 0.95)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              padding: '12px 24px',
              zIndex: 50,
              maxWidth: '576px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              borderRadius: '0 0 16px 16px',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Avatar
                src={profile?.avatar_url}
                name={profile?.name || 'User'}
                size="sm"
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f3f1ea', lineHeight: '1.2' }}>
                  {profile?.name || 'Explorer'}
                </span>
                <span style={{ fontSize: '9px', color: '#9ba6ad', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Level {idVerified && trustScore >= 75 ? 'Trusted Legend' : idVerified && trustScore >= 50 ? 'Verified Explorer' : 'New Seed'}
                </span>
              </div>
            </div>
            
            <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '4px 10px', borderRadius: '100px', background: 'rgba(79, 190, 142, 0.14)', color: '#4fbe8e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🛡️ {trustScore} pts
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ width: '100%', maxWidth: '768px', margin: '0 auto', padding: '28px 24px 80px', display: 'flex', flexDirection: 'column', gap: '20px', userSelect: 'none' }}>
        
        {/* Top Header Card */}
        <div
          style={{
            background: '#1a2129',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}
          className="flex-col sm:flex-row text-center sm:text-left"
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              src={profile?.avatar_url}
              name={profile?.name || 'User'}
              size="xl"
            />
            {/* Outline ring based on status */}
            <div 
              style={{
                position: 'absolute',
                inset: '-3px',
                borderRadius: '50%',
                border: '2px solid',
                borderColor: trustScore >= 75 ? '#4fbe8e' : trustScore >= 50 ? '#3b82f6' : 'transparent',
                pointerEvents: 'none'
              }}
            />
          </div>

          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
              {profile?.name || 'Explorer'}
            </h2>
            
            {/* Bio info */}
            {profile?.bio ? (
              <p style={{ fontSize: '14px', color: '#9ba6ad', fontStyle: 'italic', margin: 0, lineHeight: '1.5' }}>
                "{profile.bio}"
              </p>
            ) : (
              <p style={{ fontSize: '14px', color: '#6b757c', fontStyle: 'italic', margin: 0 }}>No bio added yet.</p>
            )}

            {/* Verification status pill */}
            <div style={{ display: 'flex', marginTop: '4px' }} className="justify-center sm:justify-start">
              {idVerified ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: trustScore >= 75 ? 'rgba(79, 190, 142, 0.14)' : 'rgba(59, 130, 246, 0.14)', border: trustScore >= 75 ? '1px solid rgba(79, 190, 142, 0.20)' : '1px solid rgba(59, 130, 246, 0.20)', color: trustScore >= 75 ? '#4fbe8e' : '#3b82f6', fontSize: '12px', fontWeight: '600', borderRadius: '100px' }}>
                  {trustScore >= 75 ? '👑 Trusted Legend' : '🛡️ Verified Explorer'}
                </span>
              ) : (
                <Link
                  to="/profile/me/verify-id"
                  onMouseEnter={() => setIsVerifyHovered(true)}
                  onMouseLeave={() => setIsVerifyHovered(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    background: isVerifyHovered ? 'rgba(255, 201, 77, 0.25)' : 'rgba(255, 201, 77, 0.16)',
                    border: '1px solid rgba(255, 201, 77, 0.20)',
                    color: '#ffc94d',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '100px',
                    transition: 'background 150ms ease'
                  }}
                >
                  🌱 New Seed (Verify ID ➔)
                </Link>
              )}
            </div>
          </div>

          <Link
            to="/profile/me/settings"
            onClick={() => haptics.lightTap()}
            onMouseEnter={() => setIsCogHovered(true)}
            onMouseLeave={() => setIsCogHovered(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '36px',
              height: '36px',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isCogHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
              transition: 'background 150ms ease'
            }}
            title="Settings"
          >
            <svg style={{ width: '18px', height: '18px', color: '#9ba6ad' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <button
            onClick={() => {
              haptics.lightTap()
              setShowBottomSheet(true)
            }}
            style={{
              background: '#1a2129',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              transition: 'background 150ms ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1a2129' }}
          >
            <TrustCircle score={trustScore} size={64} />
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>
              Trust Score
            </span>
          </button>

          <div
            style={{
              background: '#1a2129',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'var(--font-mono)', color: '#f3f1ea', lineHeight: 1 }}>
              {reliabilityScore}%
            </span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1 }}>
              Reliability
            </span>
          </div>
        </div>

        {/* Interests */}
        <div
          style={{
            background: '#1a2129',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f3f1ea', margin: 0 }}>
            Interest Vibe Tags
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {interestTags.length > 0 ? (
              interestTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    borderRadius: '100px',
                    fontSize: '13.5px',
                    fontWeight: '500',
                    border: '1px solid transparent',
                    color: '#ff6a2c',
                    background: 'rgba(255,106,44,0.14)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tag}
                </span>
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#6b757c', fontStyle: 'italic' }}>No interests selected.</span>
                <Link
                  to="/profile/me/edit"
                  style={{ fontSize: '13px', color: '#ff6a2c', fontWeight: '700', textDecoration: 'underline' }}
                >
                  Add your interests to match with trips
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick links list */}
        <div
          style={{
            background: '#1a2129',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <Link
            to="/profile/me/emergency"
            onClick={() => haptics.lightTap()}
            onMouseEnter={() => setHoveredTripId('emergency')}
            onMouseLeave={() => setHoveredTripId(null)}
            style={{
              padding: '16px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'background 150ms ease',
              textDecoration: 'none',
              background: hoveredTripId === 'emergency' ? 'rgba(255,255,255,0.03)' : 'transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px' }}>🚨</span>
              <span style={{ fontSize: '15px', fontWeight: '500', color: '#f3f1ea' }}>Manage Emergency Contacts</span>
            </div>
            <svg style={{ width: '16px', height: '16px', color: '#6b757c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Trip History Tabs */}
        <div
          style={{
            background: '#1a2129',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex' }}>
            <button
              onClick={() => {
                haptics.lightTap()
                setActiveTab('hosted')
              }}
              style={{
                flex: 1,
                padding: '14px 0',
                fontSize: '14px',
                fontWeight: '700',
                textAlign: 'center',
                border: 'none',
                borderBottom: '2px solid',
                borderColor: activeTab === 'hosted' ? '#ff6a2c' : 'transparent',
                color: activeTab === 'hosted' ? '#ff6a2c' : '#9ba6ad',
                background: 'none',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              Hosted Trips ({hostedTrips.length})
            </button>
            <button
              onClick={() => {
                haptics.lightTap()
                setActiveTab('attended')
              }}
              style={{
                flex: 1,
                padding: '14px 0',
                fontSize: '14px',
                fontWeight: '700',
                textAlign: 'center',
                border: 'none',
                borderBottom: '2px solid',
                borderColor: activeTab === 'attended' ? '#ff6a2c' : 'transparent',
                color: activeTab === 'attended' ? '#ff6a2c' : '#9ba6ad',
                background: 'none',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              Attended Trips ({joinedTrips.length})
            </button>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '120px' }}>
            {activeTab === 'hosted' ? (
              hostedTrips.length > 0 ? (
                hostedTrips.map((trip) => {
                  const isHovered = hoveredTripId === trip.id
                  return (
                    <Link
                      key={trip.id}
                      to={`/activities/${trip.id}`}
                      onClick={() => haptics.lightTap()}
                      onMouseEnter={() => setHoveredTripId(trip.id)}
                      onMouseLeave={() => setHoveredTripId(null)}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        transition: 'background 150ms ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        background: isHovered ? 'rgba(255,255,255,0.03)' : 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#f3f1ea', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {trip.title}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b757c', marginTop: '2px' }}>
                          {new Date(trip.date_time).toLocaleDateString()}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#ff6a2c', textTransform: 'uppercase', background: 'rgba(255,106,44,0.14)', padding: '2px 8px', borderRadius: '100px', flexShrink: 0 }}>
                        {trip.category || 'Trip'}
                      </span>
                    </Link>
                  )
                })
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', items: 'center', justifyContent: 'center', padding: '24px 0', textAlign: 'center', color: '#6b757c', gap: '4px' }}>
                  <span style={{ fontSize: '28px' }}>🎒</span>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>No hosted trips yet.</span>
                </div>
              )
            ) : (
              joinedTrips.length > 0 ? (
                joinedTrips.map((trip) => {
                  const isHovered = hoveredTripId === trip.id
                  return (
                    <Link
                      key={trip.id}
                      to={`/activities/${trip.id}`}
                      onClick={() => haptics.lightTap()}
                      onMouseEnter={() => setHoveredTripId(trip.id)}
                      onMouseLeave={() => setHoveredTripId(null)}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        transition: 'background 150ms ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        background: isHovered ? 'rgba(255,255,255,0.03)' : 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#f3f1ea', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {trip.title}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b757c', marginTop: '2px' }}>
                          {new Date(trip.date_time).toLocaleDateString()}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#4fbe8e', textTransform: 'uppercase', background: 'rgba(79,190,142,0.14)', padding: '2px 8px', borderRadius: '100px', flexShrink: 0 }}>
                        Completed
                      </span>
                    </Link>
                  )
                })
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', items: 'center', justifyContent: 'center', padding: '24px 0', textAlign: 'center', color: '#6b757c', gap: '4px' }}>
                  <span style={{ fontSize: '28px' }}>🗺️</span>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>No attended trips yet.</span>
                </div>
              )
            )}
          </div>
        </div>

      </div>

      {/* Bottom Sheet for Trust Breakdown */}
      <AnimatePresence>
        {showBottomSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBottomSheet(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: '#000000',
                zIndex: 400,
                cursor: 'pointer'
              }}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxWidth: '576px',
                margin: '0 auto',
                background: '#1a2129',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px 24px 0 0',
                padding: '24px',
                boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
                zIndex: 500,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                userSelect: 'none',
                paddingBottom: '48px'
              }}
            >
              <div 
                onClick={() => setShowBottomSheet(false)}
                style={{
                  width: '48px',
                  height: '4px',
                  background: '#6b757c',
                  borderRadius: '100px',
                  margin: '0 auto',
                  cursor: 'pointer'
                }}
              />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', color: '#f3f1ea', margin: 0, lineHeight: 1.2 }}>
                  Trust Score Breakdown
                </h3>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6b757c', fontWeight: '700' }}>
                  Audit log of your trust status changes
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '320px', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '6px' }}>
                {MOCK_TRUST_CHANGES.map((log) => {
                  const isHovered = hoveredLogId === log.id
                  return (
                    <div
                      key={log.id}
                      onMouseEnter={() => setHoveredLogId(log.id)}
                      onMouseLeave={() => setHoveredLogId(null)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        background: '#212b33',
                        border: '1px solid',
                        borderColor: isHovered ? '#ff6a2c' : 'rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        transition: 'border-color 150ms ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '18px', background: '#1a2129', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifycontent: 'center', border: '1px solid rgba(255,255,255,0.08)' }} className="justify-center">
                          {log.icon}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#f3f1ea', lineHeight: 1.2 }}>
                            {log.reason}
                          </span>
                          <span style={{ fontSize: '10px', color: '#6b757c', marginTop: '2px', fontWeight: '500' }}>
                            {log.date}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#4fbe8e', fontFamily: 'var(--font-mono)' }}>
                        +{log.amount}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MyProfile
export { MyProfile }
