import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AuthModal from '../../components/auth/AuthModal.jsx'
import Button from '../../components/common/Button.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import Avatar from '../../components/common/Avatar.jsx'
import { haptics } from '../../utils/haptics.js'

/**
 * BoardFeed — Sub-Community Niche Channel View
 * Features:
 * - Sub-board Glass Header with member count & subscription toggle
 * - Flair tag filters (e.g. #TrailUpdate, #GearReview, #Question)
 * - Polymorphic card rendering matching CommunityFeed
 * - Board Rules & Moderation Team sidebar
 */
const BoardFeed = () => {
  const { boardName } = useParams()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  // State
  const [board, setBoard] = useState(null)
  const [posts, setPosts] = useState([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subRole, setSubRole] = useState(null)
  const [sort, setSort] = useState('hot') // 'hot' | 'new' | 'top'
  const [selectedFlair, setSelectedFlair] = useState(null)
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  // Interaction State
  const [activeReactionPostId, setActiveReactionPostId] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState({})
  const [copiedPostId, setCopiedPostId] = useState(null)

  const fetchBoardDetails = async () => {
    try {
      setLoading(true)
      const res = await apiRequest(`/community/boards/${boardName}`)
      if (res.ok) {
        const json = await res.json()
        if (json.status === 'success' && json.data) {
          setBoard(json.data.board)
          return
        }
      }
      setBoard(null)
    } catch (err) {
      console.error('Failed to fetch board details:', err)
      setBoard(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptionStatus = async () => {
    if (!isAuthenticated) return
    try {
      const res = await apiRequest(`/community/boards/${boardName}/subscribe/status`)
      if (res.ok) {
        const json = await res.json()
        if (json.status === 'success' && json.data) {
          setIsSubscribed(json.data.subscribed)
          setSubRole(json.data.role)
        }
      }
    } catch (err) {
      console.error('Failed to fetch subscription status:', err)
    }
  }

  const fetchBoardPosts = async (currentCursor = null, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else setPostsLoading(true)

    try {
      let url = `/community/posts?board_name=${boardName}&sort=${sort}&limit=12`
      if (currentCursor) {
        url += `&cursor=${encodeURIComponent(currentCursor)}`
      }
      
      const res = await apiRequest(url)
      if (res.ok) {
        const json = await res.json()
        if (json.status === 'success' && json.data) {
          const fetched = json.data.items || []
          setPosts(prev => isLoadMore ? [...prev, ...fetched] : fetched)
          setCursor(json.data.nextCursor)
          setHasMore(!!json.data.nextCursor)
        }
      }
    } catch (err) {
      console.error('Failed to fetch board posts:', err)
    } finally {
      setPostsLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchBoardDetails()
    fetchSubscriptionStatus()
  }, [boardName, isAuthenticated])

  useEffect(() => {
    fetchBoardPosts(null, false)
  }, [boardName, sort])

  const triggerAuthModal = (action) => {
    setPendingAction(() => action)
    setAuthModalOpen(true)
  }

  const handleAuthSuccess = () => {
    if (pendingAction) {
      pendingAction()
      setPendingAction(null)
    }
    fetchBoardDetails()
    fetchSubscriptionStatus()
    fetchBoardPosts(null, false)
  }

  const handleSubscribeToggle = async () => {
    haptics.lightTap?.()
    if (!isAuthenticated) {
      triggerAuthModal(handleSubscribeToggle)
      return
    }

    const previousState = isSubscribed
    setIsSubscribed(!previousState)
    setBoard(prev => prev ? { ...prev, member_count: (prev.member_count || 1) + (previousState ? -1 : 1) } : prev)

    try {
      if (previousState) {
        await apiRequest(`/community/boards/${boardName}/subscribe`, { method: 'DELETE' })
      } else {
        await apiRequest(`/community/boards/${boardName}/subscribe`, { method: 'POST' })
      }
    } catch (err) {
      console.error('Subscription toggle failed:', err)
      setIsSubscribed(previousState)
    }
  }

  const handleVote = async (postId, value, currentVote) => {
    haptics.lightTap?.()
    if (!isAuthenticated) {
      triggerAuthModal(() => handleVote(postId, value, currentVote))
      return
    }

    const targetValue = currentVote === value ? 0 : value
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const diff = targetValue - (currentVote || 0)
      return {
        ...p,
        user_vote: targetValue,
        score: (p.score || 0) + diff
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
      console.error('Failed to vote on post:', err)
    }
  }

  const handleSave = async (postId, isSaved) => {
    haptics.lightTap?.()
    if (!isAuthenticated) {
      triggerAuthModal(() => handleSave(postId, isSaved))
      return
    }

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_saved: !isSaved } : p))

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
        await navigator.share({ title: post.title, url: shareUrl })
        return
      } catch (e) {}
    }
    navigator.clipboard.writeText(shareUrl)
    setCopiedPostId(post.id)
    setTimeout(() => setCopiedPostId(null), 2500)
  }

  // Filtered by flair
  const displayedPosts = useMemo(() => {
    if (!selectedFlair) return posts
    return posts.filter(p => p.flair === selectedFlair || p.title?.toLowerCase().includes(selectedFlair.toLowerCase()))
  }, [posts, selectedFlair])

  const getTrustBadge = (score = 50) => {
    if (score >= 75) return { color: '#33d189', bg: 'rgba(51,209,137,0.12)' }
    if (score >= 50) return { color: '#4a9eff', bg: 'rgba(74,158,255,0.12)' }
    return { color: '#9096ab', bg: 'rgba(144,150,171,0.12)' }
  }

  if (loading && !board) {
    return (
      <div className="page-container-wide flex items-center justify-center p-24">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!board && !loading) {
    return (
      <div className="page-container-wide flex flex-col items-center justify-center p-16 text-center bg-[#12151f] border border-[#1c2130] rounded-2xl">
        <h2 className="text-xl font-bold text-[#f3f4f8]">Sub-Community Not Found</h2>
        <p className="text-xs text-[#9096ab] mt-1 mb-5">The community b/{boardName} doesn't exist or has been archived.</p>
        <Link to="/community" className="px-5 py-2.5 rounded-xl bg-[#ff6a2c] text-[#1a0e08] font-bold text-xs">
          Return to Community Hub ➔
        </Link>
      </div>
    )
  }

  return (
    <div className="page-container-wide flex flex-col gap-6 text-[#f3f1ea] min-w-0 pb-20">
      
      {/* ── BOARD HEADER BANNER ──────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-[#121721] via-[#1a2333] to-[#121721] border border-[#1c2130] rounded-2xl p-6 sm:p-8 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff6a2c] to-[#d9481a] text-[#1a0e08] font-black text-2xl flex items-center justify-center shadow-lg shadow-[#ff6a2c]/20 flex-shrink-0">
              #
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-[#f3f4f8] m-0" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                  b/{board?.name}
                </h1>
                <span className="text-[11px] font-mono font-bold text-[#33d189] bg-[#122a20] px-2.5 py-0.5 rounded-full uppercase border border-[#33d189]/30">
                  {board?.type || 'Public'} Community
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#9096ab] m-0 max-w-xl leading-relaxed">
                {board?.description || 'A dedicated space for travelers to share trail guides, ask questions, and connect.'}
              </p>
              <div className="flex items-center gap-3 text-xs text-[#5c6178] mt-1 font-mono">
                <span><b>{board?.member_count || 1}</b> members</span>
                <span>•</span>
                <span>Created {new Date(board?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={handleSubscribeToggle}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                isSubscribed
                  ? 'bg-[#181c29] hover:bg-[#ff5470]/10 hover:text-[#ff5470] text-[#33d189] border-[#33d189]/40 hover:border-[#ff5470]/40'
                  : 'bg-[#ff6a2c] hover:bg-[#ffa471] text-[#1a0e08] border-transparent shadow-lg shadow-[#ff6a2c]/20'
              }`}
            >
              {isSubscribed ? '✓ Joined' : '+ Join Community'}
            </button>
            <Link
              to={`/community/submit?board=${boardName}`}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1a2129] hover:bg-[#222b36] border border-white/10 text-[#f3f4f8] font-bold text-xs transition-all text-decoration-none whitespace-nowrap"
            >
              <span>+ Post</span>
            </Link>
          </div>
        </div>

        {/* Flairs Bar */}
        {board?.flair_options?.length > 0 && (
          <div className="relative z-10 mt-5 pt-4 border-t border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-mono uppercase text-[#5c6178] flex-shrink-0">Topics:</span>
            <button
              onClick={() => setSelectedFlair(null)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border-none ${
                selectedFlair === null ? 'bg-[#ff6a2c] text-[#1a0e08]' : 'bg-[#181c29] text-[#9096ab] hover:text-[#f3f4f8]'
              }`}
            >
              All
            </button>
            {board.flair_options.map((flair, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFlair(selectedFlair === flair ? null : flair)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border-none whitespace-nowrap ${
                  selectedFlair === flair ? 'bg-[#ff6a2c] text-[#1a0e08]' : 'bg-[#181c29] text-[#9096ab] hover:text-[#f3f4f8]'
                }`}
              >
                #{flair}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 2-COLUMN LAYOUT: Feed + Rules Sidebar ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Main Feed Column */}
        <main className="lg:col-span-2 flex flex-col gap-4 min-w-0">
          
          {/* Sorting Bar */}
          <div className="bg-[#12151f] border border-[#1c2130] rounded-2xl p-2.5 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[
                { id: 'hot', label: 'Hot', icon: '🔥' },
                { id: 'new', label: 'New', icon: '⚡' },
                { id: 'top', label: 'Top', icon: '🏆' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSort(t.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    sort === t.id
                      ? 'bg-[#ff6a2c] text-[#1a0e08] shadow-md'
                      : 'text-[#9096ab] hover:text-[#f3f4f8] hover:bg-[#181c29]'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
            <span className="text-xs text-[#5c6178] font-mono">
              {displayedPosts.length} posts
            </span>
          </div>

          {/* Posts List */}
          {postsLoading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-[#12151f] border border-[#1c2130] rounded-2xl">
              <Spinner size="md" />
            </div>
          ) : displayedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-14 bg-[#12151f] border border-[#1c2130] rounded-2xl text-center">
              <div className="text-3xl mb-2">🏔️</div>
              <h3 className="text-base font-bold text-[#f3f4f8]">No posts in b/{boardName} yet</h3>
              <p className="text-xs text-[#9096ab] mt-1 mb-4">Start the conversation by publishing the first trail dispatch!</p>
              <Link to={`/community/submit?board=${boardName}`} className="px-4 py-2 rounded-xl bg-[#ff6a2c] text-[#1a0e08] font-bold text-xs">
                Create First Post
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {displayedPosts.map(post => {
                const authorBadge = getTrustBadge(post.User?.trust_score)
                const isMedia = post.type === 'image' || post.media_urls?.length > 0
                const mediaItems = post.media_urls || []
                const currentImgIdx = activeImageIndex[post.id] || 0

                return (
                  <article
                    key={post.id}
                    className="bg-[#12151f] hover:border-[#262b3a] border border-[#1c2130] rounded-2xl shadow-lg transition-all overflow-hidden flex flex-col"
                  >
                    <div className="flex">
                      {/* Left Vote Rail */}
                      <div className="community-vote-rail hidden sm:flex flex-col items-center justify-start p-3 bg-[#0d1017]/50 border-r border-[#1c2130] w-12 flex-shrink-0 gap-1">
                        <button
                          onClick={() => handleVote(post.id, 1, post.user_vote)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer border-none ${
                            post.user_vote === 1 ? 'text-[#ff6a2c] bg-[#ff6a2c]/10' : 'text-[#5c6178] hover:text-[#f3f4f8] bg-transparent'
                          }`}
                        >
                          ▲
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
                        >
                          ▼
                        </button>
                      </div>

                      {/* Main Card Content */}
                      <div className="flex-1 p-4 sm:p-5 flex flex-col gap-3 min-w-0">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Avatar
                              src={post.User?.Profile?.avatar_url}
                              name={post.User?.Profile?.name || 'Explorer'}
                              size="xs"
                              score={post.User?.trust_score || 50}
                            />
                            <Link to={`/profile/${post.user_id}`} className="font-semibold text-[#c4c5d9] hover:text-[#f3f4f8] text-decoration-none">
                              {post.User?.Profile?.name || 'Explorer'}
                            </Link>
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded" style={{ background: authorBadge.bg, color: authorBadge.color }}>
                              ★ {post.User?.trust_score ?? 50}
                            </span>
                            <span className="text-[#5c6178]">•</span>
                            <span className="text-[#5c6178] text-[11px]">
                              {new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSave(post.id, post.is_saved)}
                              className={`p-1.5 rounded-lg border-none bg-transparent cursor-pointer ${post.is_saved ? 'text-[#ff6a2c]' : 'text-[#5c6178] hover:text-[#f3f4f8]'}`}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill={post.is_saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                            </button>
                            <button
                              onClick={() => handleShare(post)}
                              className="p-1.5 text-[#5c6178] hover:text-[#f3f4f8] border-none bg-transparent cursor-pointer"
                            >
                              {copiedPostId === post.id ? <span className="text-[10px] text-[#33d189]">Copied!</span> : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>}
                            </button>
                          </div>
                        </div>

                        <Link to={`/community/post/${post.id}`} className="text-decoration-none">
                          <h2 className="text-base sm:text-lg font-bold text-[#f3f4f8] hover:text-[#ff6a2c] transition-colors leading-snug m-0" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
                            {post.title}
                          </h2>
                        </Link>

                        {post.content && (
                          <p className="text-xs sm:text-sm text-[#9096ab] line-clamp-3 leading-relaxed m-0">
                            {post.content}
                          </p>
                        )}

                        {/* Media Carousel */}
                        {isMedia && mediaItems.length > 0 && (
                          <div className="relative rounded-xl overflow-hidden bg-[#0c1017] border border-[#1c2130] my-1 max-h-[340px] flex items-center justify-center">
                            <img src={mediaItems[currentImgIdx] || mediaItems[0]} alt="Post media" className="w-full h-auto max-h-[340px] object-cover" />
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
                              </>
                            )}
                          </div>
                        )}

                        {/* Card Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#1c2130] mt-1 text-xs">
                          <button
                            onClick={() => setActiveReactionPostId(activeReactionPostId === post.id ? null : post.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181c29] hover:bg-[#222b36] border border-[#262b3a] text-[#9096ab] hover:text-[#f3f4f8] cursor-pointer"
                          >
                            <span>🏔️</span>
                            <span className="text-[11px] font-semibold">React</span>
                          </button>

                          <Link
                            to={`/community/post/${post.id}`}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#181c29] hover:bg-[#222b36] border border-[#262b3a] text-[#c4c5d9] hover:text-[#f3f4f8] text-decoration-none font-semibold text-[11.5px]"
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
                onClick={() => fetchBoardPosts(cursor, true)}
                loading={loadingMore}
                variant="secondary"
                className="px-8 py-2.5 rounded-xl border border-white/10 bg-[#12151f] hover:bg-[#181c29] text-[#f3f4f8] font-bold text-xs cursor-pointer shadow-lg"
              >
                Load More Posts ➔
              </Button>
            </div>
          )}
        </main>

        {/* Right Sidebar: Rules & Moderation */}
        <aside className="flex flex-col gap-5 sticky top-20">
          
          {/* Rules Card */}
          <div className="bg-[#12151f] border border-[#1c2130] rounded-2xl p-5 shadow-lg flex flex-col gap-3">
            <div className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#ffa471]">
              b/{boardName} Community Rules
            </div>
            {board?.rules?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {board.rules.map((rule, idx) => (
                  <div key={idx} className="flex gap-2 text-xs leading-relaxed">
                    <span className="font-bold text-[#ff6a2c] font-mono">{idx + 1}.</span>
                    <span className="text-[#9096ab]">{typeof rule === 'string' ? rule : rule.title || rule.description}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#9096ab] leading-relaxed m-0">
                1. Respect all travelers and local residents.<br/>
                2. No commercial spam or unauthorized promotions.<br/>
                3. Share verified trail conditions and coordinates when possible.
              </p>
            )}
          </div>

          {/* Mod Status */}
          <div className="bg-[#12151f] border border-[#1c2130] rounded-2xl p-5 shadow-lg flex flex-col gap-3">
            <div className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#ffa471]">
              Moderation Team
            </div>
            <div className="flex items-center gap-2 text-xs text-[#c4c5d9]">
              <span className="w-2 h-2 rounded-full bg-[#33d189]" />
              <span>Managed by Troopp Community Lead</span>
            </div>
          </div>

        </aside>

      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default BoardFeed
export { BoardFeed }
