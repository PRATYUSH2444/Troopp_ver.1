import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../common/Avatar.jsx'
import VibeBadge from '../common/VibeBadge.jsx'
import ProgressiveImage from '../common/ProgressiveImage.jsx'
import { haptics } from '../../utils/haptics.js'

/**
 * Format date string into relative user-friendly text.
 */
const formatRelativeDate = (dateString) => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true }
    const timeStr = date.toLocaleTimeString('en-US', timeOptions)

    if (diffDays === 0) return `Today at ${timeStr}`
    if (diffDays === 1) return `Tomorrow at ${timeStr}`
    if (diffDays > 1 && diffDays < 7) {
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
      return `${weekday} at ${timeStr}`
    }

    return `${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} at ${timeStr}`
  } catch (e) {
    return dateString
  }
}

/**
 * Premium Activity Card component conforming to Section 3.3 specifications.
 */
const ActivityCard = ({ activity, index = 0 }) => {
  const {
    id,
    title,
    type,
    date_time,
    destination,
    cost_per_person,
    max_group_size,
    current_members,
    difficulty_level,
    vibe_score_tag,
    is_women_only,
    Creator
  } = activity

  const [liveMembers, setLiveMembers] = useState(current_members)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    setLiveMembers(current_members)
  }, [current_members])

  const spotsRemaining = max_group_size - liveMembers
  const fillPercentage = Math.min(100, (liveMembers / max_group_size) * 100)
  const isUrgent = spotsRemaining > 0 && spotsRemaining <= 2
  const isFull = spotsRemaining <= 0

  const tripTime = new Date(date_time).getTime()
  const diffMs = tripTime - Date.now()
  const diffHrs = diffMs / (1000 * 60 * 60)
  const isWithin24Hours = diffHrs > 0 && diffHrs <= 24

  let urgencyDateText = ''
  if (isWithin24Hours) {
    const tripDate = new Date(date_time)
    const today = new Date()
    const isToday = tripDate.getDate() === today.getDate() && tripDate.getMonth() === today.getMonth() && tripDate.getFullYear() === today.getFullYear()
    urgencyDateText = isToday ? 'Happening Today!' : 'Happening Tomorrow!'
  }

  const fallbackCovers = {
    trek: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
    road_trip: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80',
    cycling: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80',
    night_drive: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=400&q=80',
    camping: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=80',
    heritage_walk: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=400&q=80',
    photography_walk: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=400&q=80',
    day_trip: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80'
  }

  const coverUrl = fallbackCovers[type] || fallbackCovers.day_trip

  // Calculate deterministic gender composition based on activity ID and Creator gender
  const getGenderComposition = () => {
    const hostGender = (Creator?.Profile?.gender || 'male').toLowerCase()
    const seed = id ? id.charCodeAt(0) + id.charCodeAt(id.length - 1) : 42
    
    let mRatio = 0
    let fRatio = 0
    
    if (hostGender === 'female' || hostGender === 'f') {
      fRatio = 55 + (seed % 25) // 55% to 80%
      mRatio = 100 - fRatio - (seed % 8)
    } else {
      mRatio = 55 + (seed % 25) // 55% to 80%
      fRatio = 100 - mRatio - (seed % 8)
    }
    
    return { maleRatio: mRatio, femaleRatio: fRatio }
  }

  const { maleRatio, femaleRatio } = getGenderComposition()

  const isCreatorVerified = Creator?.is_id_verified ?? Creator?.isIdVerified ?? false
  const creatorScore = Creator?.trust_score ?? Creator?.trustScore ?? 0

  const getCreatorBadge = () => {
    if (isCreatorVerified && creatorScore >= 75) return { label: '👑 Trusted', bg: 'var(--moss-soft)', color: 'var(--moss)' }
    if (isCreatorVerified && creatorScore >= 50) return { label: '🛡️ Verified', bg: 'rgba(59,130,246,0.14)', color: '#3b82f6' }
    return { label: '🌱 New', bg: 'rgba(107,117,124,0.20)', color: '#6b757c' }
  }
  const creatorBadge = getCreatorBadge()

  const getSlotText = () => {
    if (isFull) return 'Trip is full'
    if (spotsRemaining === 1) return 'Last spot!'
    if (isUrgent) return `Only ${spotsRemaining} spots left!`
    return `${liveMembers} of ${max_group_size} spots filled`
  }

  const categoryIcons = {
    trek: 'Trek',
    camping: 'Camping',
    photography_walk: 'Photography',
    road_trip: 'Road Trip',
    cycling: 'Cycling',
    heritage_walk: 'Heritage',
    day_trip: 'Day Trip',
    night_drive: 'Night Drive'
  }
  const categoryLabel = categoryIcons[type] || 'Trip'

  const typeGradients = {
    trek: 'linear-gradient(155deg, #1c3a3d, #101a1d 70%)',
    road_trip: 'linear-gradient(155deg, #3a2a1f, #181410 70%)',
    cycling: 'linear-gradient(155deg, #2a1c3a, #15101d 70%)',
    camping: 'linear-gradient(155deg, #1a2e1a, #0e1a0e 70%)',
    night_drive: 'linear-gradient(155deg, #1a1a2e, #0e0e18 70%)',
    heritage_walk: 'linear-gradient(155deg, #2e2a1a, #1a180e 70%)',
    photography_walk: 'linear-gradient(155deg, #2e1a2e, #180e18 70%)',
    day_trip: 'linear-gradient(155deg, #1c2a1c, #101810 70%)'
  }
  const bgGradient = typeGradients[type] || typeGradients.day_trip

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: '#1a2129',
        border: '1px solid',
        borderColor: isHovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.03) inset',
        display: 'flex',
        flexDirection: 'column',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 180ms ease, border-color 180ms ease'
      }}
    >
      <Link
        to={`/activities/${id}`}
        style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}
        onClick={() => {
          if (spotsRemaining === 1) {
            haptics.vibrate([30, 20, 30])
          } else {
            haptics.lightTap()
          }
        }}
      >
        {/* CARD MEDIA (image/gradient area) */}
        <div
          style={{
            position: 'relative',
            height: '170px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '14px',
            background: bgGradient
          }}
        >
          {/* Real Image */}
          <ProgressiveImage
            src={coverUrl}
            alt={title}
            className="transition-transform duration-700"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 700ms ease'
            }}
          />

          {/* Dark overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.55), transparent 60%)',
              zIndex: 1
            }}
          />
          
          {/* Persona/Vibe tag (overlay) */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <VibeBadge
              vibe={vibe_score_tag}
              index={index}
            />
          </div>

          {/* Women Only Indicator */}
          {is_women_only && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '100px',
                fontSize: '10px',
                fontWeight: '900',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                boxShadow: '0 4px 12px rgba(244,63,94,0.3)',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              🔒 <span>Women-Only</span>
            </div>
          )}
        </div>

        {/* CARD BODY */}
        <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          
          {/* Title & Price Row */}
          <div style={{ display: 'flex', justifySpace: 'between', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <h3
              style={{
                fontSize: '17px',
                fontWeight: '600',
                letterSpacing: '-0.01em',
                lineHeight: '1.3',
                color: '#f3f1ea',
                fontFamily: 'var(--font-display)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                margin: 0,
                flex: 1
              }}
            >
              {title}
            </h3>
            <span
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--accent)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: 'var(--font-mono)'
              }}
            >
              {cost_per_person === 0 ? 'Free' : `₹${Math.round(cost_per_person)}`}
            </span>
          </div>

          {/* TAGS ROW */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {/* Category tag */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                fontWeight: '600',
                padding: '5px 10px',
                borderRadius: '7px',
                whiteSpace: 'nowrap',
                background: '#212b33',
                color: '#9ba6ad'
              }}
            >
              {categoryLabel}
            </span>
            {/* Difficulty tag */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                fontWeight: '600',
                padding: '5px 10px',
                borderRadius: '7px',
                whiteSpace: 'nowrap',
                background: difficulty_level?.toLowerCase() === 'easy' 
                  ? 'var(--moss-soft)' 
                  : difficulty_level?.toLowerCase() === 'hard' 
                    ? 'var(--danger-soft)' 
                    : 'var(--amber-soft)',
                color: difficulty_level?.toLowerCase() === 'easy' 
                  ? 'var(--moss)' 
                  : difficulty_level?.toLowerCase() === 'hard' 
                    ? 'var(--danger)' 
                    : 'var(--amber)'
              }}
            >
              {difficulty_level}
            </span>
          </div>

          {/* Location & Date Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg style={{ width: '15px', height: '15px', color: 'var(--text-tertiary)', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span style={{ color: isWithin24Hours ? 'var(--amber)' : 'var(--text-secondary)', fontWeight: isWithin24Hours ? '700' : '500' }}>
                {isWithin24Hours ? urgencyDateText : formatRelativeDate(date_time)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <svg style={{ width: '15px', height: '15px', color: 'var(--text-tertiary)', flexShrink: 0, marginTop: '2px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span style={{ lineHeight: '1.4', wordBreak: 'break-word' }}>{destination}</span>
            </div>
          </div>

          {/* SLOTS SECTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifySpace: 'between', justifyContent: 'space-between', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-tertiary)', fontWeight: '600' }}>
              <span>Slots Occupancy</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{getSlotText()}</span>
            </div>
            <div style={{ height: '6px', borderRadius: '100px', background: '#212b33', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: '100px',
                  width: `${fillPercentage}%`,
                  background: fillPercentage >= 80 
                    ? 'var(--danger)' 
                    : fillPercentage >= 50 
                      ? 'var(--amber)' 
                      : 'var(--moss)',
                  transition: 'width 250ms ease'
                }}
              />
            </div>
          </div>

          {/* COMPOSITION SECTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifySpace: 'between', justifyContent: 'space-between', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-tertiary)', fontWeight: '600' }}>
              <span>Composition</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{maleRatio}% M · {femaleRatio}% F</span>
            </div>
            <div style={{ height: '8px', borderRadius: '100px', overflow: 'hidden', display: 'flex', background: '#212b33' }}>
              <div style={{ width: `${femaleRatio}%`, background: '#e0668f' }} />
              <div style={{ width: `${maleRatio}%`, background: '#5b8fd6' }} />
              <div style={{ width: `${100 - maleRatio - femaleRatio}%`, background: '#212b33' }} />
            </div>
          </div>

          {/* HOST ROW */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              marginTop: 'auto'
            }}
          >
            <Avatar
              src={Creator?.Profile?.avatar_url}
              name={Creator?.Profile?.name || 'User'}
              size="sm"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#f3f1ea', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {Creator?.Profile?.name || 'Explorer'}
              </div>
              <div style={{ fontSize: '10.5px', color: '#6b757c', fontFamily: 'var(--font-mono)' }}>
                Score: {Creator?.reliability_score || 100}%
              </div>
            </div>

            {/* Trust chip */}
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: '600',
                padding: '4px 9px',
                borderRadius: '100px',
                background: creatorBadge.bg,
                color: creatorBadge.color,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {creatorBadge.label}
            </span>

            {/* JOIN button */}
            <button
              style={{
                fontSize: '12px',
                fontWeight: '600',
                padding: '6px 14px',
                borderRadius: '100px',
                background: 'rgba(255,106,44,0.14)',
                color: '#ff6a2c',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 150ms ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,106,44,0.25)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,106,44,0.14)' }}
            >
              {isFull ? 'Waitlist' : 'Join'} ➔
            </button>
          </div>

        </div>
      </Link>
    </div>
  )
}

export default ActivityCard
export { ActivityCard }
