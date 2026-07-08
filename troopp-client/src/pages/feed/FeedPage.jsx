import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ActivityCard from '../../components/activity/ActivityCard.jsx'
import FilterPanel from '../../components/feed/FilterPanel.jsx'
import Spinner from '../../components/common/Spinner.jsx'

// Hardcoded operating cities matching seed values
const OPERATING_CITIES = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Mumbai' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Bengaluru' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Delhi-NCR' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Pune' }
]

const FeedPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState('foryou') // 'foryou' | 'following'
  
  // Active operating city (defaults to Mumbai seed ID)
  const defaultCityId = '11111111-1111-1111-1111-111111111111'
  const [activeCity, setActiveCity] = useState(OPERATING_CITIES[0])
  const [cityModalOpen, setCityModalOpen] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  // API State
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Scroll observer refs
  const loadMoreRef = useRef(null)

  // Extract filter parameters from URL
  const currentFilters = {
    type: searchParams.get('type') || '',
    minBudget: searchParams.get('minBudget') || '',
    maxBudget: searchParams.get('maxBudget') || '',
    difficulty: searchParams.get('difficulty') || '',
    maxGroupSize: searchParams.get('maxGroupSize') || '',
    isWomenOnly: searchParams.get('isWomenOnly') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || ''
  }

  // Count active filters (excluding defaults)
  const getActiveFilterCount = () => {
    let count = 0
    if (currentFilters.type) count++
    if (currentFilters.difficulty) count++
    if (currentFilters.isWomenOnly === 'true') count++
    if (currentFilters.maxBudget && currentFilters.maxBudget !== '5000') count++
    if (currentFilters.maxGroupSize && currentFilters.maxGroupSize !== '20') count++
    if (currentFilters.startDate || currentFilters.endDate) count++
    return count
  }

  // Load activities from server API mock/real endpoint
  const fetchActivities = async (pageNum = 1, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      // Mock API call to keep compilation safe & robust
      // In production, this targets: axios.get('/api/v1/activities', { params: { ...filters, cityId: activeCity.id } })
      await new Promise((r) => setTimeout(r, 600)) // Simulation latency

      const mockData = [
        {
          id: 'act-1',
          title: 'Harishchandragad Monsoon Trek & Night Camping',
          type: 'trek',
          date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          destination: 'Bhandardara, Maharashtra',
          cost_per_person: 1800,
          max_group_size: 12,
          current_members: 8,
          difficulty_level: 'hard',
          vibe_score_tag: '🏔️ Hardcore Adventurer',
          is_women_only: false,
          Creator: {
            trust_score: 84,
            reliability_score: 95,
            Profile: {
              name: 'Raj Malhotra',
              avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
            }
          }
        },
        {
          id: 'act-2',
          title: 'Night Cycling Exploration around Marine Drive',
          type: 'cycling',
          date_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          destination: 'Marine Drive, Mumbai',
          cost_per_person: 250,
          max_group_size: 15,
          current_members: 6,
          difficulty_level: 'easy',
          vibe_score_tag: '🚴 Fit & Free',
          is_women_only: false,
          Creator: {
            trust_score: 72,
            reliability_score: 98,
            Profile: {
              name: 'Priya Sharma',
              avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
            }
          }
        },
        {
          id: 'act-3',
          title: 'South Mumbai Heritage Photowalk & Irani Cafe Crawl',
          type: 'heritage_walk',
          date_time: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          destination: 'Fort, Mumbai',
          cost_per_person: 0,
          max_group_size: 8,
          current_members: 8,
          difficulty_level: 'easy',
          vibe_score_tag: '📸 Culture Seeker',
          is_women_only: true,
          Creator: {
            trust_score: 91,
            reliability_score: 100,
            Profile: {
              name: 'Anjali Desai',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
            }
          }
        }
      ]

      // Filter Mock Data locally to show dynamic search changes in demo
      let filtered = [...mockData]
      if (tab === 'following') {
        filtered = [mockData[2]] // Return smaller list for following filter tab
      }
      if (currentFilters.type) {
        filtered = filtered.filter((act) => act.type === currentFilters.type)
      }
      if (currentFilters.isWomenOnly === 'true') {
        filtered = filtered.filter((act) => act.is_women_only)
      }
      if (currentFilters.maxBudget) {
        filtered = filtered.filter((act) => act.cost_per_person <= parseInt(currentFilters.maxBudget))
      }

      if (isRefresh || pageNum === 1) {
        setActivities(filtered)
      } else {
        setActivities((prev) => [...prev, ...filtered])
      }
      setHasMore(pageNum < 3) // Stop loading after page 2 in simulation
    } catch (e) {
      console.error('Failed to load activity feed:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Reload feed when filters, tabs, or city selections change
  useEffect(() => {
    fetchActivities(1)
    setPage(1)
  }, [tab, activeCity, searchParams])

  // Setup scroll Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !refreshing) {
          setPage((p) => {
            const nextPage = p + 1
            fetchActivities(nextPage)
            return nextPage
          })
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, refreshing])

  const handleApplyFilters = (newFilters) => {
    const params = {}
    Object.keys(newFilters).forEach((key) => {
      if (newFilters[key] !== '' && newFilters[key] !== null) {
        params[key] = newFilters[key].toString()
      }
    })
    setSearchParams(params)
  }

  const handleResetFilters = () => {
    setSearchParams({})
  }

  const handleCitySelect = (city) => {
    setActiveCity(city)
    setCityModalOpen(false)
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* 1. Header controls */}
      <div className="flex justify-between items-center bg-surface border border-border px-4 py-3 rounded-2xl shadow-sm">
        {/* City Toggle */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
            Active Location
          </span>
          <button
            onClick={() => setCityModalOpen(true)}
            className="flex items-center gap-1.5 text-base font-bold text-text-primary hover:text-primary transition-colors mt-0.5"
          >
            📍 {activeCity.name} <span className="text-xs">▼</span>
          </button>
        </div>

        {/* Filter Trigger Button */}
        <button
          onClick={() => setFilterDrawerOpen(true)}
          className="relative h-10 px-4 rounded-xl border border-border hover:bg-stone-50 text-xs font-bold text-text-primary flex items-center gap-2 transition-colors"
        >
          <span>🔍 Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
              {getActiveFilterCount()}
            </span>
          )}
        </button>
      </div>

      {/* 2. Interactive Feed Selector Tabs */}
      <div className="flex border-b border-border/80 relative">
        {['foryou', 'following'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors outline-none ${
              tab === t ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t === 'foryou' ? 'For You' : 'Following'}

            {tab === t && (
              <motion.div
                layoutId="feedTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                style={{
                  width: '50%',
                  left: t === 'foryou' ? '0%' : '50%'
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* 3. Feed List Wrapper */}
      {loading && page === 1 ? (
        <div className="h-64 w-full flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border/60 rounded-2xl flex flex-col items-center justify-center p-6 gap-3">
          <span className="text-4xl">🎒</span>
          <h4 className="text-base font-bold text-text-primary">No activities found</h4>
          <p className="text-sm text-text-secondary max-w-sm">
            {tab === 'foryou'
              ? `There are no active trips posted in ${activeCity.name} matching your filter criteria.`
              : 'Follow other travel members in your city to see their trip plans here.'}
          </p>
          {getActiveFilterCount() > 0 && (
            <button
              onClick={handleResetFilters}
              className="mt-2 text-xs font-bold text-primary hover:underline"
            >
              Clear active filters
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map((act) => (
              <ActivityCard key={act.id} activity={act} />
            ))}
          </div>

          {/* Infinite Scroll Anchor */}
          <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
            {hasMore && !loading && (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      )}

      {/* 4. Browse Another City Modal */}
      {cityModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-surface border border-border rounded-2xl p-5 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-bold text-text-primary">Select Operating City</h3>
              <button onClick={() => setCityModalOpen(false)} className="text-xs font-bold">
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {OPERATING_CITIES.map((city) => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city)}
                  className={`w-full h-12 rounded-xl border text-left px-4 text-sm font-bold flex items-center justify-between transition-colors ${
                    activeCity.id === city.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-stone-50 text-text-secondary'
                  }`}
                >
                  <span>{city.name}</span>
                  {activeCity.id === city.id && <span>✓</span>}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* 5. Filter panel drawer */}
      <FilterPanel
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={currentFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </div>
  )
}

export default FeedPage
export { FeedPage }
