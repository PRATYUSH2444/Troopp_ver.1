import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { haptics } from '../../utils/haptics.js'

const TOKENS = {
  bg: "#121319",
  bgCard: "#181A22",
  border: "rgba(245,243,238,0.08)",
  text: "#F5F3EE",
  textMuted: "#9294A0",
  amber: "#F2994A",
  amberSoft: "rgba(242,153,74,0.16)",
  teal: "#2DD4BF",
  tealSoft: "rgba(45,212,191,0.14)",
  blue: "#5B8DEF",
  rose: "#F2578C",
}

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

function SlotGauge({ filled, total }) {
  const pct = total > 0 ? Math.min(1.0, filled / total) : 0
  const r = 40
  const circumference = Math.PI * r // half circle length
  const offset = circumference * (1 - pct)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '96px' }}>
      <svg width="96" height="58" viewBox="0 0 100 58">
        <path
          d="M10,52 A40,40 0 0 1 90,52"
          fill="none"
          stroke="rgba(245,243,238,0.08)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M10,52 A40,40 0 0 1 90,52"
          fill="none"
          stroke={TOKENS.amber}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
        <text
          x="50"
          y="44"
          textAnchor="middle"
          fill={TOKENS.text}
          fontSize="16"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="600"
        >
          {filled}/{total}
        </text>
      </svg>
      <span
        style={{ color: TOKENS.textMuted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '4px' }}
      >
        Slots filled
      </span>
    </div>
  )
}

function CompositionGauge({ male, female }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span
          style={{ color: TOKENS.textMuted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}
        >
          Composition
        </span>
        <span
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: TOKENS.text, whiteSpace: 'nowrap' }}
        >
          <span style={{ color: TOKENS.blue }}>{male}% M</span>
          <span style={{ color: TOKENS.textMuted }}> · </span>
          <span style={{ color: TOKENS.rose }}>{female}% F</span>
        </span>
      </div>
      <div
        style={{ height: '8px', width: '100%', borderRadius: '100px', overflow: 'hidden', display: 'flex', background: 'rgba(245,243,238,0.08)' }}
      >
        <div
          style={{
            width: `${male}%`,
            background: `linear-gradient(90deg, ${TOKENS.blue}, #7BA6FF)`,
            transition: "width 700ms ease",
          }}
        />
        <div
          style={{
            width: `${female}%`,
            background: `linear-gradient(90deg, #FF7FB0, ${TOKENS.rose})`,
            transition: "width 700ms ease",
          }}
        />
      </div>
      <div
        style={{ fontSize: '9px', color: 'rgba(146,148,160,0.7)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        Based on opt-in profiles
      </div>
    </div>
  )
}

function TrustRingAvatar({ src, name, initials, score }) {
  const r = 22
  const c = 2 * Math.PI * r
  const offset = c * (1 - score / 100)
  return (
    <div style={{ width: 56, height: 56, position: 'relative', flexShrink: 0 }}>
      <svg width="56" height="56" viewBox="0 0 56 56" style={{ position: 'absolute', top: 0, left: 0 }}>
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="rgba(245,243,238,0.1)"
          strokeWidth="3"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={TOKENS.teal}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 28 28)"
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: '5px',
          borderRadius: '50%',
          background: '#22242E',
          color: TOKENS.text,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 14,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '600'
        }}
      >
        {src ? (
          <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          initials
        )}
      </div>
    </div>
  )
}

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
    Creator,
    media,
    createdAt
  } = activity

  const [liveMembers, setLiveMembers] = useState(current_members)
  const [isHovered, setIsHovered] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

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
    urgencyDateText = isToday ? 'Happening Today' : 'Happening Tomorrow'
  }

  // Real-time Discovery badging signals:
  const isFillingFast = spotsRemaining > 0 && spotsRemaining <= 3
  const isTrending = liveMembers >= 5
  const isNew = createdAt && (Date.now() - new Date(createdAt).getTime()) < 24 * 60 * 60 * 1000

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

  const mediaList = Array.isArray(media) ? media : []
  const coverUrl = mediaList[0] || fallbackCovers[type] || fallbackCovers.day_trip

  // Calculate actual gender composition with privacy-safe sparsity rules
  const getGenderComposition = () => {
    const confirmed = Array.isArray(activity.ActivityMembers)
      ? activity.ActivityMembers.filter(m => m.status === 'confirmed')
      : []

    const total = confirmed.length
    if (total === 0) return { maleRatio: 0, femaleRatio: 0, totalConfirmed: 0, eligibleCount: 0 }

    let mCount = 0
    let fCount = 0
    let oCount = 0

    confirmed.forEach(m => {
      const g = (m.User?.Profile?.gender || '').toLowerCase()
      if (g === 'male') mCount++
      else if (g === 'female') fCount++
      else if (g === 'other') oCount++
    })

    const eligibleCount = mCount + fCount + oCount
    if (eligibleCount === 0) return { maleRatio: 0, femaleRatio: 0, totalConfirmed: total, eligibleCount: 0 }

    const maleRatio = Math.round((mCount / eligibleCount) * 100)
    const femaleRatio = Math.round((fCount / eligibleCount) * 100)

    return { maleRatio, femaleRatio, totalConfirmed: total, eligibleCount }
  }

  const { maleRatio, femaleRatio, totalConfirmed, eligibleCount } = getGenderComposition()

  const creatorScore = Creator?.trust_score ?? Creator?.trustScore ?? 0
  const reliabilityScore = Creator?.reliability_score ?? Creator?.reliabilityScore ?? 100

  const getCreatorInitials = () => {
    const nameStr = Creator?.Profile?.name || 'Explorer'
    return nameStr.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
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

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        borderRadius: '24px',
        overflow: 'hidden',
        background: TOKENS.bgCard,
        border: `1px solid ${isHovered ? 'rgba(255,255,255,0.14)' : TOKENS.border}`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 20px 40px -20px rgba(0,0,0,0.6)",
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 300ms ease, border-color 300ms ease',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap');
        
        .card-tooltip-trigger {
          position: relative;
        }
        .card-tooltip-content {
          visibility: hidden;
          opacity: 0;
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          background-color: #121319;
          border: 1px solid rgba(255,255,255,0.12);
          color: #f3f1ea;
          text-align: left;
          padding: 10px 14px;
          border-radius: 12px;
          width: 190px;
          font-size: 11px;
          z-index: 100;
          transition: opacity 150ms ease, visibility 150ms ease;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6);
          line-height: 1.4;
          pointer-events: none;
        }
        .card-tooltip-trigger:hover .card-tooltip-content {
          visibility: visible;
          opacity: 1;
        }
      `}</style>

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
        {/* HERO IMAGE AREA */}
        <div style={{ position: 'relative', height: '216px', overflow: 'hidden' }}>
          
          {/* Lazy-Loading Blur-Up Image Container */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {!imgLoaded && (
              <div 
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  filter: 'blur(20px)', 
                  background: `url(${coverUrl}) center/cover no-repeat`,
                  transform: 'scale(1.2)'
                }} 
              />
            )}
            <img
              src={coverUrl}
              alt={title}
              onLoad={() => setImgLoaded(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imgLoaded ? 1 : 0,
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 700ms ease, opacity 300ms ease'
              }}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: "linear-gradient(180deg, rgba(18,19,25,0) 40%, rgba(18,19,25,0.85) 100%)"
            }}
          />

          {/* Mood Badge */}
          {vibe_score_tag && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                padding: '6px 12px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(12px)',
                background: 'rgba(18,19,25,0.55)',
                border: '1px solid rgba(245,243,238,0.15)',
                color: TOKENS.text
              }}
            >
              <span>🧭</span>
              {vibe_score_tag}
            </div>
          )}

          {/* Live Badge Alerts (Filling Fast, Trending, New) */}
          <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            {is_women_only && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  fontSize: '10px',
                  fontWeight: '900',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 12px rgba(244,63,94,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                🔒 <span>Women-Only</span>
              </div>
            )}
            {(() => {
              const displayBadges = Array.isArray(activity.computed_badges)
                ? activity.computed_badges
                : [
                    isFillingFast && 'Filling Fast',
                    isTrending && 'Trending',
                    isNew && 'New'
                  ].filter(Boolean)

              return displayBadges.map(badge => {
                if (badge === 'Just Listed' || badge === 'New') {
                  return (
                    <div
                      key={badge}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '100px',
                        fontSize: '10px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        boxShadow: '0 4px 12px rgba(4,120,87,0.3)'
                      }}
                    >
                      ✨ New
                    </div>
                  )
                }
                if (badge === 'Trending') {
                  return (
                    <div
                      key={badge}
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '100px',
                        fontSize: '10px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        boxShadow: '0 4px 12px rgba(29,78,216,0.3)'
                      }}
                    >
                      🔥 Trending
                    </div>
                  )
                }
                if (badge === 'Filling Fast' || badge === 'Almost Full') {
                  return (
                    <div
                      key={badge}
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '100px',
                        fontSize: '10px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        boxShadow: '0 4px 12px rgba(217,119,6,0.3)'
                      }}
                    >
                      ⚡ {badge}
                    </div>
                  )
                }
                return null
              })
            })()}

            {urgencyDateText && (
              <div 
                style={{ 
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  backdropFilter: 'blur(12px)',
                  background: 'rgba(18,19,25,0.55)',
                  border: '1px solid rgba(245,243,238,0.15)',
                  color: TOKENS.amber
                }}
              >
                {urgencyDateText}
              </div>
            )}
          </div>
        </div>

        {/* CARD CONTENT BODY */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          {/* Title & Price Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                lineHeight: '1.3',
                fontFamily: "'Space Grotesk', sans-serif",
                color: TOKENS.text,
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
                fontSize: '18px',
                fontWeight: '600',
                fontFamily: "'JetBrains Mono', monospace",
                color: TOKENS.amber,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {cost_per_person === 0 ? 'Free' : `₹${Math.round(cost_per_person)}`}
            </span>
          </div>

          {/* Tags (Category & Difficulty) */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <span
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '100px',
                fontWeight: '500',
                background: 'rgba(91,141,239,0.14)',
                color: TOKENS.blue
              }}
            >
              {categoryLabel}
            </span>
            {difficulty_level && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  fontWeight: '500',
                  background: TOKENS.tealSoft,
                  color: TOKENS.teal
                }}
              >
                {difficulty_level}
              </span>
            )}
          </div>

          {/* Location & Date Details */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '12px',
              fontSize: '13px',
              color: TOKENS.textMuted
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path
                d="M12 22s7-7.58 7-13a7 7 0 10-14 0c0 5.42 7 13 7 13z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {destination}
            </span>
          </div>

          {/* Instrument Cluster Section */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: `1px solid ${TOKENS.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <SlotGauge filled={liveMembers} total={max_group_size} />
            <div style={{ width: '1px', height: '44px', background: TOKENS.border }} />
            
            {/* Render Composition Gauge if Sparsity check is met, otherwise show a clean placeholder text */}
            {totalConfirmed >= (activity.min_reveal_count || 3) && eligibleCount > 0 ? (
              <CompositionGauge male={maleRatio} female={femaleRatio} />
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, justifyContent: 'center' }}>
                <span style={{ color: TOKENS.textMuted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Composition
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(146,148,160,0.6)', marginTop: '4px' }}>
                  🔒 Minimum {activity.min_reveal_count || 3} members required to reveal demographics
                </span>
              </div>
            )}
          </div>

          {/* Host Row & CTA Button */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: `1px solid ${TOKENS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div style={{ position: 'relative' }}>
                <TrustRingAvatar
                  src={Creator?.Profile?.avatar_url}
                  name={Creator?.Profile?.name}
                  initials={getCreatorInitials()}
                  score={creatorScore}
                />
                {/* Host Presence active indicator dot */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    background: Creator?.is_online ? '#22c55e' : '#6b757c',
                    border: `2px solid ${TOKENS.bgCard}`,
                    boxShadow: Creator?.is_online ? '0 0 8px #22c55e' : 'none'
                  }}
                  title={Creator?.is_online ? 'Host is active now' : 'Host is offline'}
                />
              </div>
              
              {/* Detailed Trust Tooltip */}
              <div className="card-tooltip-trigger" style={{ minWidth: 0 }}>
                <div className="card-tooltip-content">
                  <div style={{ fontWeight: '700', marginBottom: '6px', color: '#ff6a2c', fontFamily: "'Space Grotesk', sans-serif" }}>Host Safety Profile</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ color: '#9ba6ad' }}>Trust score:</span>
                    <span style={{ fontWeight: '600', color: TOKENS.teal }}>{creatorScore}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ color: '#9ba6ad' }}>Reliability:</span>
                    <span style={{ fontWeight: '600', color: TOKENS.amber }}>{reliabilityScore}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px', marginTop: '4px' }}>
                    <span style={{ color: '#9ba6ad' }}>Avg Response:</span>
                    <span style={{ fontWeight: '500', color: '#f3f1ea' }}>
                      {Creator?.response_time_hours ? `${Creator.response_time_hours} hrs` : '< 15 mins'}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: TOKENS.text,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {Creator?.Profile?.name || 'Explorer'}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={TOKENS.teal}>
                    <path d="M12 2l2.4 6.6L21 9.3l-5 4.4L17.4 21 12 17.3 6.6 21 8 13.7 3 9.3l6.6-.7L12 2z" />
                  </svg>
                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace",
                      color: TOKENS.teal,
                      borderBottom: '1px dashed rgba(45,212,191,0.4)',
                      paddingBottom: '1px'
                    }}
                  >
                    {creatorScore}% trusted
                  </span>
                </div>
              </div>
            </div>

            <button
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                background: `linear-gradient(135deg, ${TOKENS.amber}, #E8763C)`,
                color: "#1A1109",
                border: 'none',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                boxShadow: "0 4px 14px rgba(242,153,74,0.35)",
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)' }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
            >
              {isFull ? 'Waitlist' : 'Join'} →
            </button>
          </div>

        </div>
      </Link>
    </div>
  )
}

export default ActivityCard
export { ActivityCard }
