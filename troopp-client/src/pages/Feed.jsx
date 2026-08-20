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

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Trekking', value: 'trek', emoji: '🥾' },
  { label: 'Camping', value: 'camping', emoji: '⛺' },
  { label: 'Photography', value: 'photography_walk', emoji: '📷' },
  { label: 'Road Trips', value: 'road_trip', emoji: '🚗' },
  { label: 'Cycling', value: 'cycling', emoji: '🚴' },
  { label: 'Heritage', value: 'heritage_walk', emoji: '🏛️' },
  { label: 'Day Trips', value: 'day_trip', emoji: '☀️' }
]

const DIFFICULTIES = ['easy', 'moderate', 'hard', 'expert']

const Feed = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [newTripsList, setNewTripsList] = useState([])
  const [showPill, setShowPill] = useState(false)
  const [highlightedIds, setHighlightedIds] = useState([])

  const navigate = useNavigate()

  // Filter & Facet States
  const [selectedCategories, setSelectedCategories] = useState([]) // Array of types
  const [selectedDifficulties, setSelectedDifficulties] = useState([]) // Array of difficulties
  const [cities, setCities] = useState([])
  const [selectedCityId, setSelectedCityId] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [minTrust, setMinTrust] = useState(0)
  const [maxBudget, setMaxBudget] = useState(15000)
  
  // Date states
  const [datePreset, setDatePreset] = useState('') // '', 'weekend', 'next7'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Search input state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('newest')
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  // Facet count indicators
  const [facets, setFacets] = useState({ categories: [], difficulties: [], cities: [] })

  const { isAuthenticated } = useAuth()
  const socketRef = useRef(null)
  const [socketConnected, setSocketConnected] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim())
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // 1. Initialize real-time WebSockets with polling fallback
  useEffect(() => {
    if (!isAuthenticated) return

    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'
    const token = getAccessToken()
    
    const socket = io(serverUrl, {
      auth: { token }
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setSocketConnected(true)
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
    })

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

  // 2. Polling Fallback if socket layer goes offline
  useEffect(() => {
    if (socketConnected) return

    const pollInterval = setInterval(async () => {
      try {
        const activeIds = activities.map(a => a.id)
        if (activeIds.length === 0) return
        
        let query = `?limit=100`
        if (selectedCityId) query += `&cityId=${selectedCityId}`

        const res = await apiRequest(`/activities${query}`)
        if (res.ok) {
          const json = await res.json()
          const freshList = json.data?.activities || json.data || []
          
          setActivities(prev =>
            prev.map(act => {
              const fresh = freshList.find(f => f.id === act.id)
              return fresh ? { ...act, current_members: fresh.current_members, status: fresh.status } : act
            })
          )
        }
      } catch (err) {
        console.error('Polling updates failed:', err)
      }
    }, 15000)

    return () => clearInterval(pollInterval)
  }, [socketConnected, activities, selectedCityId])

  // 3. Load Cities List
  useEffect(() => {
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

  // 4. Core Query Fetching pipeline
  const fetchActivities = async (cursorVal = null, append = false) => {
    if (cursorVal) {
      setIsFetchingNextPage(true)
    } else {
      setLoading(true)
    }

    try {
      let queryParams = []
      
      if (selectedCityId) queryParams.push(`cityId=${selectedCityId}`)
      
      if (selectedCategories.length > 0) {
        queryParams.push(`type=${selectedCategories.join(',')}`)
      }
      
      if (selectedDifficulties.length > 0) {
        queryParams.push(`difficulty=${selectedDifficulties.join(',')}`)
      }

      if (minTrust > 0) queryParams.push(`min_trust=${minTrust}`)
      if (maxBudget < 15000) queryParams.push(`maxBudget=${maxBudget}`)
      
      if (startDate) queryParams.push(`startDate=${startDate}`)
      if (endDate) queryParams.push(`endDate=${endDate}`)
      
      if (debouncedSearchQuery) queryParams.push(`q=${encodeURIComponent(debouncedSearchQuery)}`)
      
      if (sortBy) queryParams.push(`sort=${sortBy}`)
      if (cursorVal) queryParams.push(`cursor=${cursorVal}`)

      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : ''
      const res = await apiRequest(`/activities${queryStr}`)
      
      if (res.ok) {
        const json = await res.json()
        const fetchedData = json.data || {}
        const rawList = fetchedData.activities || []
        
        if (append) {
          setActivities((prev) => [...prev, ...rawList])
        } else {
          setActivities(rawList)
        }

        setNextCursor(fetchedData.nextCursor)
        setHasMore(!!fetchedData.nextCursor)

        if (fetchedData.facets) {
          setFacets(fetchedData.facets)
        }
      } else {
        throw new Error('Could not retrieve discovery activities.')
      }
    } catch (err) {
      toast.error(err.message || 'Error fetching feed.')
    } finally {
      setLoading(false)
      setIsFetchingNextPage(false)
    }
  }

  // Reload lists on filter/search parameters change
  useEffect(() => {
    fetchActivities(null, false)
  }, [selectedCityId, selectedCategories, selectedDifficulties, minTrust, maxBudget, startDate, endDate, debouncedSearchQuery, sortBy])

  // 5. Scroll Prefetching at 70% depth
  const observer = useRef()
  const lastActivityRef = (node) => {
    if (loading || isFetchingNextPage) return
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && nextCursor) {
        haptics.lightTap()
        fetchActivities(nextCursor, true)
      }
    }, {
      rootMargin: '250px' // triggers load before reaching the bottom
    })
    
    if (node) observer.current.observe(node)
  }

  // Handle category chip selects
  const toggleCategory = (categoryVal) => {
    haptics.lightTap()
    if (categoryVal === 'all') {
      setSelectedCategories([])
      return
    }

    setSelectedCategories((prev) => {
      if (prev.includes(categoryVal)) {
        return prev.filter((c) => c !== categoryVal)
      } else {
        return [...prev, categoryVal]
      }
    })
  }

  // Handle difficulty checkboxes
  const toggleDifficulty = (level) => {
    haptics.lightTap()
    setSelectedDifficulties((prev) => {
      if (prev.includes(level)) {
        return prev.filter((d) => d !== level)
      } else {
        return [...prev, level]
      }
    })
  }

  // Handle dynamic date range smart presets
  const applyDatePreset = (preset) => {
    haptics.lightTap()
    setDatePreset(preset)
    if (preset === 'weekend') {
      const today = new Date()
      const sat = new Date(today)
      sat.setDate(today.getDate() + (6 - today.getDay()))
      sat.setHours(0,0,0,0)
      const sun = new Date(sat)
      sun.setDate(sat.getDate() + 1)
      sun.setHours(23,59,59,999)
      setStartDate(sat.toISOString())
      setEndDate(sun.toISOString())
    } else if (preset === 'next7') {
      const today = new Date()
      const next7 = new Date(today)
      next7.setDate(today.getDate() + 7)
      next7.setHours(23,59,59,999)
      setStartDate(today.toISOString())
      setEndDate(next7.toISOString())
    } else {
      setStartDate('')
      setEndDate('')
    }
  }

  // Get facet counts
  const getCategoryCount = (val) => {
    if (val === 'all') return activities.length
    const match = facets.categories?.find(c => c.type === val)
    return match ? match.count : 0
  }

  const getDifficultyCount = (val) => {
    const match = facets.difficulties?.find(d => d.difficulty === val)
    return match ? match.count : 0
  }

  return (
    <PullToRefresh onRefresh={() => fetchActivities(null, false)}>
      <div className="min-h-screen pb-20 relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Ambient Blurs */}
        <div className="absolute top-1/4 left-[-10%] w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
        <div className="absolute top-2/3 right-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

        <div className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-6 select-none relative z-10">
          
          {/* HERO BANNER */}
          <div className="hero-banner">
            <div className="hero-content">
              <span className="hero-eyebrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                Weekend Adventures
              </span>
              <h1 className="hero-h1">Where to next?</h1>
              <p className="hero-p">
                Your friends are busy. Your weekend isn't. Meet verified co-travelers and hit the trails.
              </p>
              <button
                onClick={() => {
                  haptics.lightTap()
                  navigate('/activities/create')
                }}
                className="hero-cta"
                style={{ background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)' }}
              >
                Host a Trip +
              </button>
            </div>
          </div>

          {/* DYNAMIC SEARCH BAR */}
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6b757c', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by keyword, destination or activity title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                padding: '0 20px 0 46px',
                background: '#1a2129',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '14px',
                color: '#f3f1ea',
                outline: 'none'
              }}
            />
          </div>

          {/* CONTROL BAR */}
          <div className="filter-bar">
            {/* City selector */}
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
              <span style={{ fontSize: '9px', color: '#6b757c', marginLeft: '2px', pointerEvents: 'none' }}>▼</span>
            </div>

            {/* Sorting pill */}
            <div className="city-pill-select" style={{ minWidth: '150px' }}>
              <svg className="w-4 h-4 text-primary shrink-0 mr-1 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              <select
                value={sortBy}
                onChange={(e) => {
                  haptics.lightTap()
                  setSortBy(e.target.value)
                }}
                className="city-select"
              >
                <option value="newest">Sort: Chronological</option>
                <option value="personalized">Sort: Personalized</option>
                <option value="price_asc">Sort: Price (Low to High)</option>
                <option value="price_desc">Sort: Price (High to Low)</option>
                <option value="popularity">Sort: Popularity</option>
                <option value="trust">Sort: Host Trust Rating</option>
              </select>
              <span style={{ fontSize: '9px', color: '#6b757c', marginLeft: '2px', pointerEvents: 'none' }}>▼</span>
            </div>

            {/* Filter Toggle */}
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
              <span>More Filters</span>
            </button>

            <div style={{ flex: 1 }} />
          </div>

          {/* DYNAMIC FILTER DRAWER */}
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
                  marginBottom: '10px',
                  boxShadow: 'var(--shadow-card)',
                  overflow: 'hidden'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                  
                  {/* Difficulty Filters */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                      Difficulty Level
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {DIFFICULTIES.map((diff) => {
                        const active = selectedDifficulties.includes(diff)
                        const count = getDifficultyCount(diff)
                        return (
                          <label key={diff} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: '#9ba6ad' }}>
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => toggleDifficulty(diff)}
                              style={{ accentColor: '#ff6a2c' }}
                            />
                            <span style={{ textTransform: 'capitalize' }}>{diff}</span>
                            <span style={{ fontSize: '11px', color: '#6b757c' }}>({count})</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Smart Date Presets */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                      Date Ranges
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => applyDatePreset(datePreset === 'weekend' ? '' : 'weekend')}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: datePreset === 'weekend' ? '1px solid #ff6a2c' : '1px solid rgba(255,255,255,0.08)',
                          background: datePreset === 'weekend' ? 'rgba(255,106,44,0.12)' : '#1a2129',
                          color: datePreset === 'weekend' ? '#ff6a2c' : '#9ba6ad',
                          cursor: 'pointer'
                        }}
                      >
                        📅 This Weekend
                      </button>
                      <button
                        onClick={() => applyDatePreset(datePreset === 'next7' ? '' : 'next7')}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: datePreset === 'next7' ? '1px solid #ff6a2c' : '1px solid rgba(255,255,255,0.08)',
                          background: datePreset === 'next7' ? 'rgba(255,106,44,0.12)' : '#1a2129',
                          color: datePreset === 'next7' ? '#ff6a2c' : '#9ba6ad',
                          cursor: 'pointer'
                        }}
                      >
                        🚀 Next 7 Days
                      </button>
                    </div>
                  </div>

                  {/* Trust Score Sliders */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                        Min Host Trust
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#2dd4bf', fontFamily: 'var(--font-mono)' }}>
                        {minTrust}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={minTrust}
                      onChange={(e) => setMinTrust(parseInt(e.target.value))}
                      style={{ width: '100%', height: '4px', background: 'var(--surface-raised)', borderRadius: '2px', cursor: 'pointer', accentColor: '#2dd4bf' }}
                    />
                  </div>

                  {/* Price Sliders */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                        Max Budget
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#ff6a2c', fontFamily: 'var(--font-mono)' }}>
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
                      style={{ width: '100%', height: '4px', background: 'var(--surface-raised)', borderRadius: '2px', cursor: 'pointer', accentColor: '#ff6a2c' }}
                    />
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MULTI-SELECT CATEGORY CHIPS */}
          <div className="relative w-full overflow-hidden select-none" style={{ marginBottom: '14px' }}>
            <div className="flex gap-2.5 overflow-x-auto scrollbar-none py-1" style={{ scrollbarWidth: 'none' }}>
              {CATEGORIES.map((cat) => {
                const isAll = cat.value === 'all'
                const active = isAll ? selectedCategories.length === 0 : selectedCategories.includes(cat.value)
                const count = getCategoryCount(cat.value)
                
                return (
                  <button
                    key={cat.value}
                    onClick={() => toggleCategory(cat.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '9px 16px',
                      borderRadius: '100px',
                      fontSize: '13px',
                      fontWeight: active ? '600' : '500',
                      border: active ? '1px solid transparent' : '1px solid rgba(255,255,255,0.08)',
                      color: active ? '#ff6a2c' : '#9ba6ad',
                      background: active ? 'rgba(255,106,44,0.14)' : '#1a2129',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{cat.emoji || '🌐'}</span>
                    <span>{cat.label}</span>
                    {count > 0 && <span style={{ fontSize: '10px', opacity: 0.6 }}>({count})</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ACTIVE FILTER CHIPS & COUNT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#9ba6ad', fontWeight: '500' }}>
                  {loading ? 'Finding trips...' : `${activities.length} ${activities.length === 1 ? 'trip' : 'trips'} matching filters`}
                </span>
                {loading && (
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ff6a2c', animation: 'pulse 1s infinite' }} />
                )}
              </div>
              {selectedCategories.length > 0 || selectedDifficulties.length > 0 || selectedCityId || maxBudget < 15000 || startDate || endDate ? (
                <button
                  onClick={() => {
                    haptics.lightTap()
                    setSelectedCategories([])
                    setSelectedDifficulties([])
                    setSelectedCityId('')
                    setMinTrust(0)
                    setMaxBudget(15000)
                    setSearchQuery('')
                    setStartDate('')
                    setEndDate('')
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ff6a2c',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Clear all
                </button>
              ) : null}
            </div>

            {/* CHIPS LIST */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedCategories.map(catVal => {
                const catObj = CATEGORIES.find(c => c.value === catVal)
                if (!catObj) return null
                return (
                  <div
                    key={`chip-cat-${catVal}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#1a2129',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '5px 12px',
                      borderRadius: '100px',
                      fontSize: '12.5px',
                      color: '#f3f1ea'
                    }}
                  >
                    <span>{catObj.emoji} {catObj.label}</span>
                    <button
                      onClick={() => {
                        haptics.lightTap()
                        setSelectedCategories(prev => prev.filter(c => c !== catVal))
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#6b757c', cursor: 'pointer', padding: '0 2px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                    >
                      ✕
                    </button>
                  </div>
                )
              })}

              {selectedDifficulties.map(diff => (
                <div
                  key={`chip-diff-${diff}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#1a2129',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '5px 12px',
                    borderRadius: '100px',
                    fontSize: '12.5px',
                    color: '#f3f1ea',
                    textTransform: 'capitalize'
                  }}
                >
                  <span>⚡ {diff}</span>
                  <button
                    onClick={() => {
                      haptics.lightTap()
                      setSelectedDifficulties(prev => prev.filter(d => d !== diff))
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#6b757c', cursor: 'pointer', padding: '0 2px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {selectedCityId && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#1a2129',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '5px 12px',
                    borderRadius: '100px',
                    fontSize: '12.5px',
                    color: '#f3f1ea'
                  }}
                >
                  <span>📍 {cities.find(c => c.id === selectedCityId)?.city_name || 'Selected City'}</span>
                  <button
                    onClick={() => {
                      haptics.lightTap()
                      setSelectedCityId('')
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#6b757c', cursor: 'pointer', padding: '0 2px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {maxBudget < 15000 && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#1a2129',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '5px 12px',
                    borderRadius: '100px',
                    fontSize: '12.5px',
                    color: '#f3f1ea'
                  }}
                >
                  <span>💰 Under ₹{maxBudget}</span>
                  <button
                    onClick={() => {
                      haptics.lightTap()
                      setMaxBudget(15000)
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#6b757c', cursor: 'pointer', padding: '0 2px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {(startDate || endDate) && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#1a2129',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '5px 12px',
                    borderRadius: '100px',
                    fontSize: '12.5px',
                    color: '#f3f1ea'
                  }}
                >
                  <span>📅 {startDate || '*'} to {endDate || '*'}</span>
                  <button
                    onClick={() => {
                      haptics.lightTap()
                      setStartDate('')
                      setEndDate('')
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#6b757c', cursor: 'pointer', padding: '0 2px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RESULTS GRID / SKELETON */}
          <div>
            {loading ? (
              <FeedSkeleton />
            ) : activities.length > 0 ? (
              <>
                <div className="cards-grid">
                  {activities.map((act, index) => {
                    const isHighlighted = highlightedIds.includes(act.id)
                    const isLastElement = index === activities.length - 1
                    
                    return (
                      <motion.div
                        key={act.id}
                        ref={isLastElement ? lastActivityRef : null}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{
                          delay: Math.min(index * 0.04, 0.24),
                          duration: 0.35,
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

                {/* Infinite Scroll Prefetching shimmers */}
                {isFetchingNextPage && (
                  <div style={{ marginTop: '24px' }}>
                    <FeedSkeleton />
                  </div>
                )}
              </>
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
                  No matching trips found
                </h4>
                <p style={{ fontSize: '15px', color: '#9ba6ad', margin: 0, lineHeight: 1.4 }}>
                  Try adjusting your search criteria, widening your radius or clearing selected filters.
                </p>
                <button
                  onClick={() => {
                    haptics.lightTap()
                    setSelectedCategories([])
                    setSelectedDifficulties([])
                    setMinTrust(0)
                    setMaxBudget(15000)
                    setSearchQuery('')
                    setStartDate('')
                    setEndDate('')
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
                    marginTop: '8px'
                  }}
                >
                  Clear All Filters
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
