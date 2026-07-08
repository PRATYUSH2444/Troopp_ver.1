import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ActivityCard from '../../components/activity/ActivityCard.jsx'
import Avatar from '../../components/common/Avatar.jsx'
import Spinner from '../../components/common/Spinner.jsx'

const SearchPage = () => {
  const [activeTab, setActiveTab] = useState('activities') // 'activities' | 'people'
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState([])

  // API states
  const [loading, setLoading] = useState(false)
  const [activityResults, setActivityResults] = useState([])
  const [peopleResults, setPeopleResults] = useState([])

  // 1. Load search history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('troopp_search_history')
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }
  }, [])

  // 2. Debounce query value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // 3. Save to search history
  const saveToHistory = (term) => {
    if (!term || term.trim() === '') return
    const trimmed = term.trim()
    const updated = [trimmed, ...searchHistory.filter((item) => item !== trimmed)].slice(0, 5)
    setSearchHistory(updated)
    localStorage.setItem('troopp_search_history', JSON.stringify(updated))
  }

  const removeHistoryItem = (term, e) => {
    e.stopPropagation()
    const updated = searchHistory.filter((item) => item !== term)
    setSearchHistory(updated)
    localStorage.setItem('troopp_search_history', JSON.stringify(updated))
  }

  // 4. Fetch search results on debounced query change
  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.trim() === '') {
        setActivityResults([])
        setPeopleResults([])
        return
      }

      setLoading(true)
      saveToHistory(debouncedQuery)

      try {
        // Simulating search call latency
        await new Promise((r) => setTimeout(r, 500))

        // Mock Activity Search results
        const mockActs = [
          {
            id: 'search-act-1',
            title: `Exploratory Trip to ${debouncedQuery}`,
            type: 'road_trip',
            date_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            destination: debouncedQuery,
            cost_per_person: 1200,
            max_group_size: 6,
            current_members: 3,
            difficulty_level: 'moderate',
            vibe_score_tag: '🚗 Open Road Soul',
            is_women_only: false,
            Creator: {
              trust_score: 78,
              reliability_score: 92,
              Profile: {
                name: 'Karan Mehra',
                avatar_url: null
              }
            }
          }
        ]

        // Mock People search results
        const mockPeople = [
          {
            id: 'user-1',
            name: 'Karan Mehra',
            city: 'Mumbai',
            avatar_url: null,
            trust_score: 78,
            is_following: false
          },
          {
            id: 'user-2',
            name: `${debouncedQuery} Explorer`,
            city: 'Bengaluru',
            avatar_url: null,
            trust_score: 82,
            is_following: true
          }
        ]

        setActivityResults(mockActs)
        setPeopleResults(mockPeople)
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  // Handle follow click simulation
  const toggleFollow = (userId) => {
    setPeopleResults((prev) =>
      prev.map((person) =>
        person.id === userId ? { ...person, is_following: !person.is_following } : person
      )
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      {/* Search Input bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for upcoming trips, destinations, or people..."
          className="w-full h-12 rounded-2xl border border-border bg-surface px-5 pr-12 text-sm outline-none shadow-sm focus:border-primary transition-all font-semibold text-text-primary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-sm font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* Search History Chips */}
      {searchHistory.length > 0 && !searchQuery && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
            Recent Searches
          </span>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="h-8 pl-3 pr-2.5 rounded-full border border-border hover:bg-stone-50 text-xs font-bold text-text-secondary flex items-center gap-1.5 transition-colors"
              >
                <span>{term}</span>
                <span
                  onClick={(e) => removeHistoryItem(term, e)}
                  className="hover:text-primary transition-colors text-[10px]"
                >
                  ✕
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border/80 relative">
        {['activities', 'people'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors outline-none ${
              activeTab === tab ? 'text-primary' : 'text-text-secondary'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="searchTabHighlight"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                style={{
                  width: '50%',
                  left: tab === 'activities' ? '0%' : '50%'
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Results viewport */}
      {loading ? (
        <div className="h-64 w-full flex items-center justify-center">
          <Spinner size="md" />
        </div>
      ) : searchQuery === '' ? (
        <div className="text-center py-20 flex flex-col items-center gap-2">
          <span className="text-4xl">🔍</span>
          <h4 className="text-sm font-bold text-text-primary">Type something to search</h4>
          <p className="text-xs text-text-secondary">Find treks, cycling groups, or other travelers.</p>
        </div>
      ) : activeTab === 'activities' && activityResults.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-2">
          <h4 className="text-sm font-bold text-text-primary">No activities matching "{debouncedQuery}"</h4>
          <p className="text-xs text-text-secondary">Try searching for other destinations or tags.</p>
        </div>
      ) : activeTab === 'people' && peopleResults.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-2">
          <h4 className="text-sm font-bold text-text-primary">No travelers matching "{debouncedQuery}"</h4>
          <p className="text-xs text-text-secondary">Check spelling or try common names.</p>
        </div>
      ) : activeTab === 'activities' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {activityResults.map((act) => (
            <ActivityCard key={act.id} activity={act} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 animate-fade-in">
          {peopleResults.map((person) => (
            <div
              key={person.id}
              className="glass-card p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <Avatar src={person.avatar_url} name={person.name} size="md" score={person.trust_score} />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-primary leading-tight">
                    {person.name}
                  </span>
                  <span className="text-[10px] text-text-secondary">
                    📍 {person.city} · Score: {person.trust_score}
                  </span>
                </div>
              </div>

              <button
                onClick={() => toggleFollow(person.id)}
                className={`h-9 px-4 rounded-xl text-xs font-bold transition-all ${
                  person.is_following
                    ? 'border border-border bg-stone-50 text-text-secondary hover:bg-stone-100'
                    : 'bg-primary text-white hover:bg-primary-dark shadow-sm'
                }`}
              >
                {person.is_following ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchPage
export { SearchPage }
