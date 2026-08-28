import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AuthModal from '../../components/auth/AuthModal.jsx'
import Button from '../../components/common/Button.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import Avatar from '../../components/common/Avatar.jsx'
import { haptics } from '../../utils/haptics.js'

/**
 * CommunityFeed — Next-Gen Travel Social & Discovery Feed
 * Features:
 * - 5 Feed Views: For You (Personalized), Hot (Trending), New (Live), Top (Best), Trail Reports (Verified)
 * - Polymorphic Post Rendering (Text, Multi-Media Carousel, Link Preview, Interactive Poll, Trip-Linked Report)
 * - Multi-Reactions (🔥 Inspiring, 🏔️ Bucket List, 💡 Helpful Tip, ⚠️ Caution) + Standard Up/Down Votes
 * - Real-time Search & Category/Tag Filtering
 * - Live Discovery Rail (Trending Trails, Recommended Communities, Verified Guides)
 */
const CommunityFeed = () => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  // Feed & Data State
  const [posts, setPosts] = useState([])
  const [boards, setBoards] = useState([])
  const [sort, setSort] = useState('for_you') // 'for_you' | 'hot' | 'new' | 'top' | 'trail_reports'
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'trek' | 'guide' | 'poll' | 'media'
  const [searchQuery, setSearchQuery] = useState('')
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  // Interaction State
  const [activeReactionPostId, setActiveReactionPostId] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState({})
  const [copiedPostId, setCopiedPostId] = useState(null)

  // Fetch Boards List
  const fetchBoards = async () => {
    try {
      const res = await apiRequest('/community/boards?limit=15')
      if (res.ok) {
        const json = await res.json()
        if (json.status === 'success' && json.data) {
          setBoards(json.data.items || [])
        }
      }
    } catch (err) {
      console.error('Failed to fetch community boards:', err)
    }
  }

  // Fetch Posts Feed
  const fetchPosts = async (currentCursor = null, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)

    try {
      const apiSort = sort === 'for_you' ? 'hot' : sort === 'trail_reports' ? 'hot' : sort
      let url = `/community/posts?sort=${apiSort}&limit=12`
      if (currentCursor) {
        url += `&cursor=${encodeURIComponent(currentCursor)}`
      }

      const res = await apiRequest(url)
      if (res.ok) {
        const json = await res.json()
        if (json.status === 'success' && json.data) {
          let fetched = json.data.items || []

          if (sort === 'trail_reports') {
            fetched = fetched.filter(p => p.type === 'trip_report' || p.trip_room_id || p.type === 'image')
          }

          setPosts(prev => isLoadMore ? [...prev, ...fetched] : fetched)
          setCursor(json.data.nextCursor)
          setHasMore(!!json.data.nextCursor)
        }
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchBoards()
    fetchPosts(null, false)
  }, [sort])

  const triggerAuthModal = (action) => {
    setPendingAction(() => action)
    setAuthModalOpen(true)
  }

  const handleAuthSuccess = () => {
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
    fetchPosts(null, false)
    fetchBoards()
  }

  const handleVote = async (postId, value, currentVote) => {
    haptics.lightTap?.()
    if (!isAuthenticated) {
      triggerAuthModal(() => handleVote(postId, value, currentVote))
      return
    }

    const targetValue = currentVote === value ? 0 : value
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post
      const voteDiff = targetValue - (currentVote || 0)
      return {
        ...post,
        user_vote: targetValue,
        score: (post.score || 0) + voteDiff
      }
    }))

    try {
      await apiRequest('/community/votes', {
        method: 'POST',
        body: JSON.stringify({
          target_id: postId,
          target_type: 'post',
          value: targetValue
        })
      })
    } catch (err) {
      console.error('Failed to cast vote:', err)
    }
  }

  const handleReaction = async (postId, reactionKey) => {
    haptics.lightTap?.()
    if (!isAuthenticated) {
      triggerAuthModal(() => handleReaction(postId, reactionKey))
      return
    }

    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const currentReactions = p.reactions || {}
      const hasReacted = currentReactions[reactionKey]?.includes(user?.id)
      const updatedList = hasReacted
        ? (currentReactions[reactionKey] || []).filter(id => id !== user?.id)
        : [...(currentReactions[reactionKey] || []), user?.id]

      return {
        ...p,
        reactions: {
          ...currentReactions,
          [reactionKey]: updatedList
        }
      }
    }))
    setActiveReactionPostId(null)
  }

  const handleSave = async (postId, isSaved) => {
    haptics.lightTap?.()
    if (!isAuthenticated) {
      triggerAuthModal(() => handleSave(postId, isSaved))
      return
    }

    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post
      return { ...post, is_saved: !isSaved }
    }))

    try {
      await apiRequest('/community/saved-items/toggle', {
        method: 'POST',
        body: JSON.stringify({
          target_id: postId,
          target_type: 'post'
        })
      })
    } catch (err) {
      console.error('Failed to toggle save:', err)
    }
  }

  const handleShare = async (post) => {
    haptics.lightTap?.()
    const shareUrl = `${window.location.origin}/community/post/${post.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Check out this travel post on Troopp: ${post.title}`,
          url: shareUrl
        })
        return
      } catch (err) {}
    }

    navigator.clipboard.writeText(shareUrl)
    setCopiedPostId(post.id)
    setTimeout(() => setCopiedPostId(null), 2500)
  }

  const handlePollVote = async (postId, optionIdx) => {
    haptics.lightTap?.()
    if (!isAuthenticated) {
      triggerAuthModal(() => handlePollVote(postId, optionIdx))
      return
    }

    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post
      const currentPoll = post.poll_data || {}
      const votes = [...(currentPoll.votes || [])]
      votes[optionIdx] = (votes[optionIdx] || 0) + 1
      return {
        ...post,
        poll_data: {
          ...currentPoll,
          votes,
          user_voted_idx: optionIdx,
          total_votes: (currentPoll.total_votes || 0) + 1
        }
      }
    }))

    try {
      await apiRequest(`/community/posts/${postId}/poll/vote`, {
        method: 'POST',
        body: JSON.stringify({ option_index: optionIdx })
      })
    } catch (err) {
      console.error('Failed to submit poll vote:', err)
    }
  }

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = post.title?.toLowerCase().includes(q)
        const matchContent = post.content?.toLowerCase().includes(q)
        const matchBoard = post.Board?.name?.toLowerCase().includes(q)
        const matchAuthor = post.User?.Profile?.name?.toLowerCase().includes(q)
        if (!matchTitle && !matchContent && !matchBoard && !matchAuthor) return false
      }

      if (activeFilter === 'trek' && post.type !== 'trip_report' && !post.Board?.name?.includes('trek')) return false
      if (activeFilter === 'poll' && post.type !== 'poll') return false
      if (activeFilter === 'media' && post.type !== 'image' && !post.media_urls?.length) return false
      if (activeFilter === 'guide' && (post.User?.trust_score || 0) < 75) return false

      return true
    })
  }, [posts, searchQuery, activeFilter])

  const getTrustBadge = (score = 50) => {
    if (score >= 75) return { color: '#33d189', label: 'Verified Explorer', bg: 'rgba(51,209,137,0.12)' }
    if (score >= 50) return { color: '#4a9eff', label: 'Trusted Member', bg: 'rgba(74,158,255,0.12)' }
    return { color: '#9096ab', label: 'Explorer', bg: 'rgba(144,150,171,0.12)' }
  }

  return (
    <div className="page-container-wide flex flex-col gap-6 text-[#f3f1ea] min-w-0 pb-20">
      
      {/* ── TOP HERO & SEARCH BAR ────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-[#121721] via-[#182030] to-[#121721] border border-[#1c2130] rounded-2xl p-6 sm:p-8 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex flex-col gap-1.5 max-w-xl">
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-[#ffa471]">
              <span className="w-2 h-2 rounded-full bg-[#33d189] animate-pulse" />
              Verified Community &amp; Expedition Logs
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#f3f4f8] tracking-tight m-0" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
              Explore Trails, Stories &amp; Intel
            </h1>
            <p className="text-xs sm:text-sm text-[#9096ab] m-0 leading-relaxed">
              Connect with verified hikers, compare real GPS trail reports, and discover trip intel backed by real-world Peer Trust.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              to="/community/submit"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff6a2c] to-[#d9481a] text-[#1a0e08] font-bold text-sm shadow-lg shadow-[#ff6a2c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-decoration-none whitespace-nowrap"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              <span>Create Post</span>
            </Link>
            <Link
              to="/community/create-board"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a2129] hover:bg-[#222b36] border border-white/10 text-[#f3f4f8] font-semibold text-sm transition-all text-decoration-none whitespace-nowrap"
            >
              <span>+ New Board</span>
            </Link>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative z-10 mt-6 flex items-center bg-[#0d1017]/80 border border-[#262b3a] rounded-xl px-4 py-2 focus-within:border-[#ff6a2c] transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9096ab" strokeWidth="2" className="flex-shrink-0 mr-3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trails, peaks, gear, authors, or boards (e.g. #Kedarkantha, b/himachal)..."
            className="w-full bg-transparent text-sm text-[#f3f4f8] placeholder:text-[#5c6178] outline-none border-none p-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#9096ab] hover:text-[#f3f4f8] bg-white/5 px-2 py-0.5 rounded cursor-pointer border-none"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── 3-COLUMN COMMUNITY WORKSPACE ─────────────────────────────── */}
      <div className="community-grid items-start gap-6">

        {/* ── LEFT RAIL: Communities & Boards ────────────────────────── */}
        <aside className="community-left-col bg-[#12151f] border border-[#1c2130] rounded-2xl p-5 shadow-lg flex flex-col gap-5 sticky top-20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#ffa471]">
              Sub-Communities
            </span>
            <Link to="/community/boards" className="text-xs text-[#9096ab] hover:text-[#f3f4f8] transition-colors">
              View all
            </Link>
          </div>

          <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
            {boards.map((b) => (
              <Link
                key={b.id || b.name}
                to={`/community/b/${b.name}`}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#181c29] transition-all group text-decoration-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[rgba(255,106,44,0.12)] text-[#ff6a2c] flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:bg-[#ff6a2c] group-hover:text-[#1a0e08] transition-colors">
                    #
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#f3f4f8] truncate group-hover:text-[#ff6a2c] transition-colors">
                      b/{b.name}
                    </div>
                    <div className="text-[10px] text-[#5c6178] truncate">
                      {b.member_count || 1} members
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-[#5c6178] group-hover:translate-x-0.5 transition-transform">➔</span>
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-[#1c2130]">
            <div className="text-[11px] font-bold text-[#9096ab] uppercase tracking-wider mb-2">
              Popular Tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['#WinterTrek', '#SoloTravel', '#GearReview', '#Himalayas', '#BudgetTrips', '#TrailSafety'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="text-[11px] font-medium bg-[#181c29] hover:bg-[#222736] text-[#9096ab] hover:text-[#f3f4f8] px-2.5 py-1 rounded-lg border border-[#262b3a] transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── CENTER COLUMN: Main Feed ───────────────────────────────── */}
        <main className="flex flex-col gap-4 min-w-0 w-full">
          
          {/* Feed Filter & Sort Header Bar */}
          <div className="bg-[#12151f] border border-[#1c2130] rounded-2xl p-2.5 sm:p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'for_you', label: 'For You', icon: '✨' },
                { id: 'hot', label: 'Hot', icon: '🔥' },
                { id: 'new', label: 'New', icon: '⚡' },
                { id: 'top', label: 'Top', icon: '🏆' },
                { id: 'trail_reports', label: 'Trail Reports', icon: '🏔️' }
              ].map(tab => {
                const isActive = sort === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      haptics.lightTap?.()
                      setSort(tab.id)
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#ff6a2c] text-[#1a0e08] shadow-md shadow-[#ff6a2c]/20'
                        : 'text-[#9096ab] hover:text-[#f3f4f8] hover:bg-[#181c29]'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#9096ab]">
              <span className="text-[11px] font-mono uppercase text-[#5c6178] hidden sm:inline">Filter:</span>
              {['all', 'trek', 'poll', 'media'].map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-2.5 py-1 rounded-lg font-semibold uppercase text-[10.5px] transition-colors cursor-pointer border-none ${
                    activeFilter === f
                      ? 'bg-[#181c29] text-[#ffa471] border border-[#ff6a2c]/30'
                      : 'bg-transparent text-[#5c6178] hover:text-[#f3f4f8]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Feed Posts Container */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-[#12151f] border border-[#1c2130] rounded-2xl">
              <Spinner size="md" />
              <span className="text-xs text-[#9096ab] mt-3 font-mono">Loading community dispatch...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-14 bg-[#12151f] border border-[#1c2130] rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#181c29] flex items-center justify-center text-2xl mb-3">
                🧭
              </div>
              <h3 className="text-lg font-bold text-[#f3f4f8] m-0">No posts found</h3>
              <p className="text-xs text-[#9096ab] max-w-sm mt-1 mb-5">
                {searchQuery ? `No results matching "${searchQuery}". Try a different keyword or reset filters.` : 'Be the first traveler to post in this category!'}
              </p>
              <Link
                to="/community/submit"
                className="px-4 py-2 rounded-xl bg-[#ff6a2c] text-[#1a0e08] font-bold text-xs hover:scale-105 transition-transform"
              >
                Publish New Post
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredPosts.map(post => {
                const authorBadge = getTrustBadge(post.User?.trust_score)
                const isPoll = post.type === 'poll'
                const isTripReport = post.type === 'trip_report' || post.trip_room_id
                const isMedia = post.type === 'image' || post.media_urls?.length > 0
                const mediaItems = post.media_urls || []
                const currentImgIdx = activeImageIndex[post.id] || 0

                return (
                  <article
                    key={post.id}
                    className="bg-[#12151f] hover:border-[#262b3a] border border-[#1c2130] rounded-2xl shadow-lg transition-all overflow-hidden flex flex-col"
                  >
                    <div className="flex">
                      
                      {/* Left Vote Rail (Desktop) */}
                      <div className="community-vote-rail hidden sm:flex flex-col items-center justify-start p-3 bg-[#0d1017]/50 border-r border-[#1c2130] w-12 flex-shrink-0 gap-1">
                        <button
                          onClick={() => handleVote(post.id, 1, post.user_vote)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer border-none ${
                            post.user_vote === 1 ? 'text-[#ff6a2c] bg-[#ff6a2c]/10' : 'text-[#5c6178] hover:text-[#f3f4f8] bg-transparent'
                          }`}
                          title="Upvote"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h5v8h6v-8h5z"/></svg>
                        </button>
                        <span className={`text-xs font-mono font-bold ${
                          post.user_vote === 1 ? 'text-[#ff6a2c]' : post.user_vote === -1 ? 'text-[#ff5470]' : 'text-[#f3f4f8]'
                        }`}>
                          {post.score || 0}
                        </span>
                        <button
                          onClick={() => handleVote(post.id, -1, post.user_vote)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer border-none ${
                            post.user_vote === -1 ? 'text-[#ff5470] bg-[#ff5470]/10' : 'text-[#5c6178] hover:text-[#f3f4f8] bg-transparent'
                          }`}
                          title="Downvote"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8h-5V4H9v8H4z"/></svg>
                        </button>
                      </div>

                      {/* Main Post Card Content */}
                      <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3 min-w-0">
                        
                        {/* Header: Board, Author Trust Ring, Timestamp */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            {post.Board && (
                              <Link
                                to={`/community/b/${post.Board.name}`}
                                className="font-bold text-[#ff6a2c] bg-[rgba(255,106,44,0.12)] hover:bg-[#ff6a2c] hover:text-[#1a0e08] px-2.5 py-0.5 rounded-md transition-colors text-decoration-none"
                              >
                                b/{post.Board.name}
                              </Link>
                            )}

                            {isTripReport && (
                              <span className="flex items-center gap-1 font-mono font-bold text-[10px] text-[#33d189] bg-[#122a20] px-2 py-0.5 rounded border border-[#33d189]/30">
                                <span>📍</span> Verified Trail Log
                              </span>
                            )}

                            <span className="text-[#5c6178]">•</span>

                            {/* Author */}
                            <div className="flex items-center gap-1.5">
                              <Avatar
                                src={post.User?.Profile?.avatar_url}
                                name={post.User?.Profile?.name || 'Explorer'}
                                size="xs"
                                score={post.User?.trust_score || 50}
                              />
                              <Link
                                to={`/profile/${post.user_id}`}
                                className="font-semibold text-[#c4c5d9] hover:text-[#f3f4f8] transition-colors text-decoration-none"
                              >
                                {post.User?.Profile?.name || 'Explorer'}
                              </Link>
                              <span
                                className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded"
                                style={{ background: authorBadge.bg, color: authorBadge.color }}
                              >
                                ★ {post.User?.trust_score ?? 50}
                              </span>
                            </div>

                            <span className="text-[#5c6178]">•</span>
                            <span className="text-[#5c6178] text-[11px]">
                              {new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          {/* Quick Share / Bookmark Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSave(post.id, post.is_saved)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer border-none ${
                                post.is_saved ? 'text-[#ff6a2c] bg-[#ff6a2c]/10' : 'text-[#5c6178] hover:text-[#f3f4f8] bg-transparent'
                              }`}
                              title={post.is_saved ? 'Bookmarked' : 'Save post'}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill={post.is_saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                            </button>
                            <button
                              onClick={() => handleShare(post)}
                              className="p-1.5 text-[#5c6178] hover:text-[#f3f4f8] rounded-lg transition-colors cursor-pointer bg-transparent border-none"
                              title="Share post link"
                            >
                              {copiedPostId === post.id ? (
                                <span className="text-[10px] text-[#33d189] font-bold">Copied!</span>
                              ) : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <Link to={`/community/post/${post.id}`} className="text-decoration-none">
                          <h2
                            className="text-base sm:text-lg font-bold text-[#f3f4f8] hover:text-[#ff6a2c] transition-colors leading-snug m-0"
                            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                          >
                            {post.title}
                          </h2>
                        </Link>

                        {/* Content Excerpt */}
                        {post.content && (
                          <p className="text-xs sm:text-sm text-[#9096ab] line-clamp-3 leading-relaxed m-0">
                            {post.content}
                          </p>
                        )}

                        {/* Multi-Media Carousel */}
                        {isMedia && mediaItems.length > 0 && (
                          <div className="relative rounded-xl overflow-hidden bg-[#0c1017] border border-[#1c2130] my-1 max-h-[360px] flex items-center justify-center">
                            <img
                              src={mediaItems[currentImgIdx] || mediaItems[0]}
                              alt="Trip media"
                              className="w-full h-auto max-h-[360px] object-cover"
                            />
                            {mediaItems.length > 1 && (
                              <>
                                <button
                                  onClick={() => setActiveImageIndex(prev => ({ ...prev, [post.id]: Math.max(0, currentImgIdx - 1) }))}
                                  disabled={currentImgIdx === 0}
                                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30 cursor-pointer border-none"
                                >
                                  ◀
                                </button>
                                <button
                                  onClick={() => setActiveImageIndex(prev => ({ ...prev, [post.id]: Math.min(mediaItems.length - 1, currentImgIdx + 1) }))}
                                  disabled={currentImgIdx === mediaItems.length - 1}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30 cursor-pointer border-none"
                                >
                                  ▶
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-black/70 font-mono text-[10px] text-white">
                                  {currentImgIdx + 1} / {mediaItems.length}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Interactive Poll Component */}
                        {isPoll && post.poll_data && (
                          <div className="p-3.5 bg-[#181c29] border border-[#1c2130] rounded-xl flex flex-col gap-2 my-1">
                            <div className="text-[11px] font-bold text-[#ffa471] uppercase tracking-wider">
                              Community Poll • {post.poll_data.total_votes || 0} votes
                            </div>
                            {(post.poll_data.options || []).map((opt, optIdx) => {
                              const voteCount = post.poll_data.votes?.[optIdx] || 0
                              const total = post.poll_data.total_votes || 1
                              const pct = Math.round((voteCount / total) * 100)
                              const isVoted = post.poll_data.user_voted_idx === optIdx

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => handlePollVote(post.id, optIdx)}
                                  className={`relative w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs font-semibold overflow-hidden transition-all cursor-pointer ${
                                    isVoted ? 'border-[#ff6a2c] text-[#f3f4f8]' : 'border-[#262b3a] text-[#9096ab] hover:border-white/20'
                                  }`}
                                >
                                  <div
                                    className="absolute left-0 top-0 bottom-0 bg-[#ff6a2c]/15 transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                  <span className="relative z-10">{opt}</span>
                                  <span className="relative z-10 font-mono text-[11px] text-[#ffa471]">{pct}%</span>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* Verified Trip Linked Badge Strip */}
                        {post.trip_room_id && (
                          <div className="p-2.5 rounded-xl bg-[rgba(51,209,137,0.08)] border border-[rgba(51,209,137,0.2)] flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-base">🎒</span>
                              <div>
                                <span className="font-bold text-[#33d189]">Linked Expedition Room</span>
                                <span className="text-[#9096ab] block text-[11px]">Includes verified GPS coordinates and packing checklist</span>
                              </div>
                            </div>
                            <Link
                              to={`/trip/${post.trip_room_id}`}
                              className="px-3 py-1 bg-[#33d189] text-[#062017] font-bold rounded-lg hover:bg-[#4edea3] transition-colors whitespace-nowrap text-decoration-none text-[11px]"
                            >
                              Open Room ➔
                            </Link>
                          </div>
                        )}

                        {/* Footer: Reactions Bar + Replies Link */}
                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#1c2130] mt-1 text-xs">
                          
                          {/* Mobile Vote Controls */}
                          <div className="flex sm:hidden items-center gap-1.5 bg-[#181c29] px-2 py-1 rounded-lg">
                            <button
                              onClick={() => handleVote(post.id, 1, post.user_vote)}
                              className={`border-none bg-transparent cursor-pointer ${post.user_vote === 1 ? 'text-[#ff6a2c]' : 'text-[#5c6178]'}`}
                            >
                              ▲
                            </button>
                            <span className="font-bold font-mono text-xs text-[#f3f4f8]">{post.score || 0}</span>
                            <button
                              onClick={() => handleVote(post.id, -1, post.user_vote)}
                              className={`border-none bg-transparent cursor-pointer ${post.user_vote === -1 ? 'text-[#ff5470]' : 'text-[#5c6178]'}`}
                            >
                              ▼
                            </button>
                          </div>

                          {/* Multi-Reactions Pill */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveReactionPostId(activeReactionPostId === post.id ? null : post.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181c29] hover:bg-[#222b36] border border-[#262b3a] text-[#9096ab] hover:text-[#f3f4f8] transition-colors cursor-pointer"
                            >
                              <span>🏔️</span>
                              <span className="text-[11px] font-semibold">React</span>
                            </button>

                            {activeReactionPostId === post.id && (
                              <div className="absolute left-0 bottom-9 bg-[#181c29] border border-white/10 rounded-xl p-1.5 shadow-2xl flex items-center gap-2 z-30">
                                {[
                                  { k: 'fire', icon: '🔥', label: 'Inspiring' },
                                  { k: 'mountain', icon: '🏔️', label: 'Bucket List' },
                                  { k: 'bulb', icon: '💡', label: 'Helpful' },
                                  { k: 'warning', icon: '⚠️', label: 'Caution' }
                                ].map(r => (
                                  <button
                                    key={r.k}
                                    onClick={() => handleReaction(post.id, r.k)}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-base cursor-pointer border-none bg-transparent"
                                    title={r.label}
                                  >
                                    {r.icon}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Replies Button */}
                          <Link
                            to={`/community/post/${post.id}`}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#181c29] hover:bg-[#222b36] border border-[#262b3a] text-[#c4c5d9] hover:text-[#f3f4f8] transition-colors text-decoration-none font-semibold text-[11.5px] ml-auto"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            <span>{post.comment_count || 0} replies</span>
                          </Link>

                        </div>

                      </div>

                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={() => fetchPosts(cursor, true)}
                loading={loadingMore}
                variant="secondary"
                className="px-8 py-2.5 rounded-xl border border-white/10 bg-[#12151f] hover:bg-[#181c29] text-[#f3f4f8] font-bold text-xs cursor-pointer shadow-lg"
              >
                Load More Posts ➔
              </Button>
            </div>
          )}

        </main>

        {/* ── RIGHT RAIL: Discovery & Top Guides ─────────────────────── */}
        <aside className="community-right-col bg-[#12151f] border border-[#1c2130] rounded-2xl p-5 shadow-lg flex flex-col gap-5 sticky top-20">
          <div>
            <div className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#ffa471] mb-2">
              Trail Rules &amp; Ethics
            </div>
            <p className="text-xs text-[#9096ab] leading-relaxed m-0">
              Leave No Trace. Always respect local mountain guidelines and verify weather before high-altitude passes.
            </p>
          </div>

          <div className="pt-3 border-t border-[#1c2130]">
            <div className="text-[11px] font-bold text-[#f3f4f8] uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Trending Destinations</span>
              <span className="text-[10px] text-[#33d189] font-mono">LIVE</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { name: 'Tungnath & Chandrashila', posts: '48 posts this week', tag: '#Tungnath' },
                { name: 'Spiti Winter Expedition', posts: '32 posts this week', tag: '#SpitiValley' },
                { name: 'Chadar Frozen River', posts: '27 posts this week', tag: '#ChadarTrek' }
              ].map((dest, idx) => (
                <div
                  key={idx}
                  onClick={() => setSearchQuery(dest.tag)}
                  className="p-2.5 rounded-xl bg-[#181c29] hover:bg-[#202738] border border-[#262b3a] transition-all cursor-pointer flex flex-col gap-0.5"
                >
                  <div className="font-bold text-xs text-[#f3f4f8]">{dest.name}</div>
                  <div className="text-[10px] text-[#5c6178] font-mono">{dest.posts}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#1c2130]">
            <div className="text-[11px] font-bold text-[#f3f4f8] uppercase tracking-wider mb-2.5">
              Top Verified Guides
            </div>
            <div className="flex flex-col gap-2">
              {[
                { name: 'Dev Shrivastav', score: 94, area: 'Garhwal Alps' },
                { name: 'Priya Prakash', score: 88, area: 'Himachal Treks' }
              ].map((guide, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#181c29]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#ff6a2c] text-[#1a0e08] flex items-center justify-center font-bold text-xs">
                      {guide.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#f3f4f8]">{guide.name}</div>
                      <div className="text-[10px] text-[#9096ab]">{guide.area}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#33d189] bg-[#122a20] px-1.5 py-0.5 rounded">
                    ★ {guide.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>

      {/* Auth Interception Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

    </div>
  )
}

export default CommunityFeed
