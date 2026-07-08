import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../utils/api.js'
import { haptics } from '../utils/haptics.js'
import Spinner from '../components/common/Spinner.jsx'
import ActivityCard from '../components/activity/ActivityCard.jsx'

const HISTORY_CACHE_KEY = 'troopp_search_history'

const TRENDING_SEARCHES = [
  'Weekend Treks',
  'Night Drives',
  'Photography Walks',
  'Cycling Routes',
  'Camping Sites'
]

const DISCOVER_TYPES = [
  { label: 'Weekend Treks', value: 'trek', emoji: '🥾', gradient: 'linear-gradient(135deg, #10B981, #047857)' },
  { label: 'Road Trips', value: 'road_trip', emoji: '🚗', gradient: 'linear-gradient(135deg, #F59E0B, #B45309)' },
  { label: 'Cycling Routes', value: 'cycling', emoji: '🚴', gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  { label: 'Night Drives', value: 'night_drive', emoji: '🌃', gradient: 'linear-gradient(135deg, #6366F1, #4338CA)' },
  { label: 'Camping Sites', value: 'camping', emoji: '⛺', gradient: 'linear-gradient(135deg, #F97316, #C2410C)' },
  { label: 'Heritage Walks', value: 'heritage_walk', emoji: '🏛️', gradient: 'linear-gradient(135deg, #78716C, #44403C)' },
  { label: 'Photography', value: 'photography_walk', emoji: '📷', gradient: 'linear-gradient(135deg, #EC4899, #BE185D)' },
  { label: 'Day Trips', value: 'day_trip', emoji: '☀️', gradient: 'linear-gradient(135deg, #14B8A6, #0F766E)' },
]

/**
 * Premium Search viewport with category suggestions, trending items,
 * and high-fidelity empty representations.
 */
const Search = () => {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_CACHE_KEY)
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (err) {
        console.error('Failed parsing search history:', err)
      }
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([])
      return
    }

    const performSearch = async () => {
      setLoading(true)
      try {
        const res = await apiRequest(`/activities?search=${encodeURIComponent(debouncedQuery)}`)
        if (res.ok) {
          const json = await res.json()
          setResults(json.data.activities || json.data || [])
          
          setHistory((prev) => {
            const updated = [debouncedQuery, ...prev.filter((q) => q !== debouncedQuery)].slice(0, 5)
            localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(updated))
            return updated
          })
        }
      } catch (err) {
        toast.error('Search failed. Try again.')
      } finally {
        setLoading(false)
      }
    }
    performSearch()
  }, [debouncedQuery])

  const clearHistory = () => {
    haptics.lightTap()
    setHistory([])
    localStorage.removeItem(HISTORY_CACHE_KEY)
  }

  const handleChipClick = (term) => {
    haptics.lightTap()
    setQuery(term)
  }

  const handleTypeClick = (typeValue) => {
    haptics.lightTap()
    setQuery(typeValue)
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#10151a' }}>
      <div style={{ width: '100%', maxWidth: '1300px', margin: '0 auto', padding: '28px 40px 80px' }}>
        
        {/* Search input wrapper */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          {/* Magnifier icon */}
          <span
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b757c',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              zIndex: 10
            }}
          >
            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </span>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search trips, places, or people..."
            style={{
              width: '100%',
              height: '52px',
              padding: '0 80px 0 48px',
              background: '#1a2129',
              border: '1px solid',
              borderColor: isFocused ? '#ff6a2c' : 'rgba(255,255,255,0.08)',
              borderRadius: '100px',
              fontSize: '15px',
              color: '#f3f1ea',
              boxShadow: isFocused 
                ? '0 2px 8px rgba(0,0,0,0.20), 0 0 0 3px rgba(255,106,44,0.20)' 
                : '0 2px 8px rgba(0,0,0,0.20)',
              outline: 'none',
              transition: 'border-color 150ms ease, box-shadow 150ms ease'
            }}
          />

          {query && (
            <button
              onClick={() => {
                haptics.lightTap()
                setQuery('')
              }}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#ff6a2c',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '6px 12px'
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Suggested searches (when query is empty) */}
        {!query && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', userSelect: 'none' }}>
            
            {/* Recent Searches */}
            {history.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Recent Searches
                  </span>
                  <button
                    onClick={clearHistory}
                    style={{ background: 'none', border: 'none', fontSize: '10px', fontWeight: '700', color: 'var(--danger)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    Clear History
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {history.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleChipClick(term)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '9px 16px',
                        borderRadius: '100px',
                        fontSize: '13.5px',
                        fontWeight: '500',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#9ba6ad',
                        background: '#1a2129',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', display: 'block' }}>
                Popular searches
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleChipClick(term)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '9px 16px',
                      borderRadius: '100px',
                      fontSize: '13.5px',
                      fontWeight: '500',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#9ba6ad',
                      background: '#1a2129',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Discover by Type Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                Discover by Type
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {DISCOVER_TYPES.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => handleTypeClick(type.value)}
                    style={{
                      height: '96px',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'between',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                      background: type.gradient,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                      <span style={{ fontSize: '28px', select: 'none', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
                        {type.emoji}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', marginTop: 'auto', letterSpacing: '-0.01em' }}>
                      {type.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Results view */}
        <div style={{ paddingBottom: '48px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
              <Spinner size="md" />
            </div>
          ) : query ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Search Results ({results.length})
                </span>
                <button
                  onClick={() => setQuery('')}
                  style={{ background: 'none', border: 'none', fontSize: '12px', color: '#ff6a2c', fontWeight: '600', cursor: 'pointer' }}
                >
                  Clear search
                </button>
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-2">
                  {results.map((act, idx) => (
                    <ActivityCard key={act.id} activity={act} index={idx} />
                  ))}
                </div>
              ) : (
                /* Empty state */
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
                    borderRadius: '24px',
                    maxWidth: '440px',
                    margin: '32px auto 0',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ fontSize: '64px', marginBottom: '8px' }}>🔍</div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '22px',
                      fontWeight: '700',
                      color: '#f3f1ea',
                      margin: 0
                    }}
                  >
                    No trips found
                  </h3>
                  <p style={{ fontSize: '15px', color: '#9ba6ad', textAlign: 'center', margin: 0, maxWidth: '300px', lineHeight: '1.5' }}>
                    Try a different keyword or browse by category
                  </p>
                  <button
                    onClick={() => {
                      haptics.lightTap()
                      setQuery('')
                    }}
                    style={{
                      marginTop: '12px',
                      padding: '10px 20px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#stone-300',
                      cursor: 'pointer',
                      transition: 'background 150ms'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  >
                    Browse All Trips
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

      </div>
    </div>
  )
}

export default Search
export { Search }
