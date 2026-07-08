import React, { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { io } from 'socket.io-client'
import { apiRequest, getAccessToken } from '../utils/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import ActivityCard from '../components/activity/ActivityCard.jsx'
import PullToRefresh from '../components/common/PullToRefresh.jsx'
import { FeedSkeleton } from '../components/common/Skeleton.jsx'
import { haptics } from '../utils/haptics.js'
import RadialFAB from '../components/ui/RadialFAB.jsx'
import RefreshIndicator from '../components/ui/RefreshIndicator.jsx'

const CATEGORIES = ['All', 'Trekking', 'Camping', 'Photography', 'Road Trips', 'Cycling', 'Heritage', 'Day Trips']

const CATEGORY_ICONS = {
  All: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Trekking: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 18l-3.5-7 L10 18H17z M9 18l3-6 2.5 5H9z" />
      <path d="M12 4a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  ),
  Camping: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20h16L12 6 4 20z" />
      <path d="M12 12v8" />
    </svg>
  ),
  Photography: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  'Road Trips': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 001 12.5V16c0 .6.4 1 1 1h2m10 0h2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
  Cycling: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="18.5" cy="17.5" r="2.5" />
      <path d="M15 6a1 1 0 100-2 1 1 0 000 2zM12 17.5l-3-6 4-2.5 3 4H20M12 11.5L9 8.5" />
    </svg>
  ),
  Heritage: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M5 21V10M19 21V10M12 3L3 10h18L12 3zM9 14h2v3H9zM13 14h2v3h-2z" />
    </svg>
  ),
  'Day Trips': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M16.2 7.8l-2 5.4-5.4 2 2-5.4 5.4-2z" />
    </svg>
  )
}

const Feed = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const [newTripsList, setNewTripsList] = useState([])
  const [showPill, setShowPill] = useState(false)
  const [highlightedIds, setHighlightedIds] = useState([])

  const navigate = useNavigate()

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [cities, setCities] = useState([])
  const [selectedCityId, setSelectedCityId] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [minTrust, setMinTrust] = useState(0)
  const [maxBudget, setMaxBudget] = useState(15000)

  const { isAuthenticated } = useAuth()
  const socketRef = useRef(null)

  // 1. Initialize authenticated real-time WebSockets to update slots and occupancy limits dynamically
  useEffect(() => {
    if (!isAuthenticated) return

    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
    const token = getAccessToken()
    
    const socket = io(serverUrl, {
      auth: { token }
    })
    socketRef.current = socket

    socket.on('activity_updated', (updatedActivity) => {
      setActivities((prev) =>
        prev.map((act) =>
          act.id === updatedActivity.id
            ? { ...act, ...updatedActivity }
            : act
        )
      )
    })

    return () => {
      socket.disconnect()
    }
  }, [isAuthenticated])

  useEffect(() => {
    // Load Cities List
    const loadCities = async () => {
      try {
        const res = await apiRequest('/cities')
        if (res.ok) {
          const data = await res.json()
          setCities(data.data || [])
        }
      } catch (err) {
        console.error('Failed loading cities:', err)
      }
    }
    loadCities()
  }, [])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      let query = '?'
      if (selectedCityId) query += `city_id=${selectedCityId}&`
      if (selectedCategory !== 'All') {
        const categoryMap = {
          'Trekking': 'trek',
          'Camping': 'camping',
          'Photography': 'photography_walk',
          'Road Trips': 'road_trip',
          'Cycling': 'cycling',
          'Heritage': 'heritage_walk',
          'Day Trips': 'day_trip'
        }
        const mappedType = categoryMap[selectedCategory] || selectedCategory.toLowerCase()
        query += `type=${mappedType}&`
      }
      if (minTrust > 0) query += `min_trust=${minTrust}&`

      const res = await apiRequest(`/activities${query}`)
      if (res.ok) {
        const json = await res.json()
        const rawList = json.data?.activities || json.data || []
        const filtered = rawList.filter((a) => parseFloat(a.cost_per_person || 0) <= maxBudget)
        setActivities(filtered)
      } else {
        throw new Error('Could not retrieve feed activities.')
      }
    } catch (err) {
      toast.error(err.message || 'Error fetching feed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [selectedCityId, selectedCategory, minTrust, maxBudget])

  useEffect(() => {
    if (loading || activities.length === 0) return

    const checkNewActivities = async () => {
      try {
        let query = '?'
        if (selectedCityId) query += `city_id=${selectedCityId}&`
        if (selectedCategory !== 'All') {
          const categoryMap = {
            'Trekking': 'trek',
            'Camping': 'camping',
            'Photography': 'photography_walk',
            'Road Trips': 'road_trip',
            'Cycling': 'cycling',
            'Heritage': 'heritage_walk',
            'Day Trips': 'day_trip'
          }
          const mappedType = categoryMap[selectedCategory] || selectedCategory.toLowerCase()
          query += `type=${mappedType}&`
        }
        if (minTrust > 0) query += `min_trust=${minTrust}&`

        const res = await apiRequest(`/activities${query}`)
        if (res.ok) {
          const json = await res.json()
          const rawList = json.data?.activities || json.data || []
          const filtered = rawList.filter((a) => parseFloat(a.cost_per_person || 0) <= maxBudget)
          
          const currentIds = new Set(activities.map(a => a.id))
          const newItems = filtered.filter(a => !currentIds.has(a.id))
          
          if (newItems.length > 0) {
            setNewTripsList(newItems)
            setShowPill(true)
            setTimeout(() => {
              setShowPill(false)
            }, 4000)
          }
        }
      } catch (err) {
        console.error('Auto-refresh check failed:', err)
      }
    }

    const interval = setInterval(checkNewActivities, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [activities, selectedCityId, selectedCategory, minTrust, maxBudget, loading])

  const handlePillClick = () => {
    haptics.tabSwitch()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setActivities((prev) => [...newTripsList, ...prev])
    setHighlightedIds(newTripsList.map(a => a.id))
    setNewTripsList([])
    setShowPill(false)
    setTimeout(() => {
      setHighlightedIds([])
    }, 2500)
  }

  return (
    <PullToRefresh onRefresh={fetchActivities}>
      <div className="min-h-screen pb-20 relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Ambient Decorative Blurs */}
        <div className="absolute top-1/4 left-[-10%] w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute top-2/3 right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

        <RefreshIndicator count={newTripsList.length} onRefresh={handlePillClick} />

        <div className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-6 select-none relative z-10">
          
          {/* HERO BANNER SECTION */}
          <div className="hero-banner">
            <div className="hero-content">
              <span className="hero-eyebrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                Weekend Adventures
              </span>
              <h1 className="hero-h1">
                Where to next?
              </h1>
              <p className="hero-p">
                Your friends are busy. Your weekend isn't. Meet verified co-travelers and hit the trails.
              </p>
              <button
                onClick={() => {
                  haptics.lightTap()
                  navigate('/activities/create')
                }}
                className="hero-cta"
                style={{
                  background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)'
                }}
              >
                Host a Trip +
              </button>
            </div>
          </div>

          {/* FILTER/CONTROL BAR */}
          <div className="filter-bar">
            {/* City select pill */}
            <div className="city-pill-select">
              <svg className="w-4 h-4 text-primary shrink-0 mr-1 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <select
                value={selectedCityId}
                onChange={(e) => {
                  haptics.lightTap()
                  setSelectedCityId(e.target.value)
                }}
                className="city-select"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.city_name || city.name}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '9px', color: '#6b757c', marginLeft: '2px', pointerEvents: 'none' }}>
                ▼
              </span>
            </div>

            {/* Filters toggle button */}
            <button
              onClick={() => {
                haptics.lightTap()
                setIsFilterOpen(!isFilterOpen)
              }}
              className={`btn-filter-toggle ${isFilterOpen ? 'btn-filter-active' : ''}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              <span>Filters</span>
            </button>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* New Activity button */}
            <button
              onClick={() => {
                haptics.lightTap()
                navigate('/activities/create')
              }}
              className="btn-host-trip"
              style={{
                background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)'
              }}
            >
              Host a Trip +
            </button>
          </div>

          {/* Sliding Filters Panel */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '20px',
                  marginBottom: '20px',
                  boxShadow: 'var(--shadow-card)',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                  
                  {/* Trust score slide */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                        Min Host Trust Score
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                        {minTrust} pts
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={minTrust}
                      onChange={(e) => setMinTrust(parseInt(e.target.value))}
                      style={{ width: '100%', height: '4px', background: 'var(--surface-raised)', borderRadius: '2px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                    />
                  </div>

                  {/* Budget slide */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                        Max Cost Estimate
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        ₹{maxBudget}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15000"
                      step="500"
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(parseInt(e.target.value))}
                      style={{ width: '100%', height: '4px', background: 'var(--surface-raised)', borderRadius: '2px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                    />
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Premium Category Tags Horizontal Scroll list */}
          <div className="relative w-full overflow-hidden select-none" style={{ marginBottom: '24px' }}>
            <div 
              className="flex gap-2.5 overflow-x-auto scrollbar-none py-1" 
              style={{ scrollbarWidth: 'none' }}
            >
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      haptics.lightTap()
                      setSelectedCategory(cat)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '9px 16px',
                      borderRadius: '100px',
                      fontSize: '13.5px',
                      fontWeight: active ? '600' : '500',
                      border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.08)',
                      color: active ? '#ff6a2c' : '#9ba6ad',
                      background: active ? 'rgba(255,106,44,0.14)' : '#1a2129',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      {CATEGORY_ICONS[cat] || CATEGORY_ICONS.All}
                    </span>
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Activities Listing Feed */}
          <div>
            {loading ? (
              <FeedSkeleton />
            ) : activities.length > 0 ? (
              <div 
                className="cards-grid"
              >
                {activities.map((act, index) => {
                  const isHighlighted = highlightedIds.includes(act.id)
                  return (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{
                        delay: Math.min(index * 0.05, 0.3),
                        duration: 0.4,
                        ease: 'easeOut'
                      }}
                      className={`rounded-2xl transition-all duration-1000 ${
                        isHighlighted ? 'bg-orange-50/50 border border-orange-200 p-0.5 animate-pulse' : ''
                      }`}
                    >
                      <ActivityCard activity={act} index={index} />
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '80px 20px',
                  gap: '16px',
                  background: '#1a2129',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  maxWidth: '480px',
                  margin: '24px auto 0',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '64px', marginBottom: '8px' }}>🏕️</div>
                <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '22px', fontWeight: '700', color: '#f3f1ea', margin: 0 }}>
                  No trips in this city yet
                </h4>
                <p style={{ fontSize: '15px', color: '#9ba6ad', margin: 0, lineHeight: 1.4 }}>
                  Be the first explorer to host one and gather your group!
                </p>
                <button
                  onClick={() => {
                    haptics.lightTap()
                    navigate('/activities/create')
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#ff6a2c',
                    color: '#1a0e08',
                    fontWeight: '600',
                    fontSize: '14.5px',
                    padding: '12px 22px',
                    borderRadius: '100px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(255,106,44,0.28)',
                    marginTop: '8px',
                    transition: 'transform 150ms ease, box-shadow 150ms ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 10px 24px rgba(255,106,44,0.38)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(255,106,44,0.28)'
                  }}
                >
                  Post a Trip +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <RadialFAB />
    </PullToRefresh>
  )
}

export default Feed
export { Feed }
