import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AuthModal from '../../components/auth/AuthModal.jsx'
import Button from '../../components/common/Button.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import Avatar from '../../components/common/Avatar.jsx'
import { haptics } from '../../utils/haptics.js'

const CommunityFeed = () => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  
  // State
  const [posts, setPosts] = useState([])
  const [boards, setBoards] = useState([])
  const [sort, setSort] = useState('hot')
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  
  // Auth interception state
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  // Screen Width State for Responsive Layout
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isDesktop = windowWidth > 1024
  const isTablet = windowWidth > 768

  // Fetch boards list for left column
  const fetchBoards = async () => {
    try {
      const res = await apiRequest('/community/boards?limit=10')
      if (res.ok) {
        const json = await res.json()
        if (json.status === 'success' && json.data) {
          setBoards(json.data.items || [])
        }
      }
    } catch (err) {
      console.error('Failed to fetch boards:', err)
    }
  }

  // Fetch posts feed
  const fetchPosts = async (currentCursor = null, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)
    
    try {
      let url = `/community/posts?sort=${sort}&limit=10`
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
    haptics.impactLight()
    if (!isAuthenticated) {
      triggerAuthModal(() => handleVote(postId, value, currentVote))
      return
    }

    const targetValue = currentVote === value ? 0 : value
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        let upvoteShift = 0
        let downvoteShift = 0
        
        if (currentVote === 1) upvoteShift -= 1
        if (currentVote === -1) downvoteShift -= 1
        
        if (targetValue === 1) upvoteShift += 1
        if (targetValue === -1) downvoteShift += 1
        
        return {
          ...post,
          user_vote: targetValue,
          upvotes: post.upvotes + upvoteShift,
          downvotes: post.downvotes + downvoteShift,
          score: post.score + (upvoteShift - downvoteShift)
        }
      }
      return post
    }))

    try {
      await apiRequest('/community/votes', {
        method: 'POST',
        body: JSON.stringify({ target_type: 'post', target_id: postId, vote_value: targetValue })
      })
    } catch (err) {
      console.error('Vote failed:', err)
      fetchPosts(null, false)
    }
  }

  const handleSave = async (postId, currentSaved) => {
    haptics.impactLight()
    if (!isAuthenticated) {
      triggerAuthModal(() => handleSave(postId, currentSaved))
      return
    }

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, is_saved: !currentSaved }
      }
      return p
    }))

    try {
      await apiRequest('/community/saved-items/toggle', {
        method: 'POST',
        body: JSON.stringify({ target_type: 'post', target_id: postId })
      })
    } catch (err) {
      console.error('Save toggle failed:', err)
      fetchPosts(null, false)
    }
  }

  const handleCreatePostClick = () => {
    if (!isAuthenticated) {
      triggerAuthModal(() => navigate('/community/submit'))
    } else {
      navigate('/community/submit')
    }
  }

  const handleCreateBoardClick = () => {
    if (!isAuthenticated) {
      triggerAuthModal(() => navigate('/community/create'))
    } else {
      navigate('/community/create')
    }
  }

  const gridTemplateColumns = isDesktop 
    ? '240px 1fr 280px' 
    : isTablet 
      ? '240px 1fr' 
      : '1fr'

  // Checks if user is eligible to moderate any community boards or is superadmin
  const canModerate = user && (user.role === 'admin' || user.role === 'moderator' || boards.some(b => b.creator_id === user.id))

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1300px', margin: '0 auto', selectNone: 'true' }}>
      
      {/* HERO BANNER SECTION */}
      <div className="hero-banner">
        <div className="hero-content">
          <span className="hero-eyebrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px', flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Community Boards
          </span>
          <h1 className="hero-h1">Traveler Hub Discussions</h1>
          <p className="hero-p">Ask advice, share destination wikis, and check local alignment recommendations from verified peers.</p>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={handleCreateBoardClick}
              className="community-btn-secondary"
            >
              Create Board
            </button>
            <button
              onClick={handleCreatePostClick}
              className="hero-cta"
              style={{
                background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                marginTop: 0
              }}
            >
              Create Post +
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: gridTemplateColumns,
          gap: '24px',
          alignItems: 'start',
          width: '100%'
        }}
      >
        
        {/* Left Column: Boards Directory */}
        {isTablet && (
          <div 
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-card)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              textAlign: 'left'
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0 }}>
              Subscribed Boards
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {boards.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No travel boards created yet.</p>
              ) : (
                boards.map(b => (
                  <Link
                    key={b.id}
                    to={`/community/b/${b.name}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      transition: 'all var(--transition-fast) ease',
                      border: '1px solid transparent',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--surface-raised)'
                      e.currentTarget.style.borderColor = 'var(--border)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = 'transparent'
                    }}
                  >
                    <div 
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '9999px',
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        textTransform: 'uppercase',
                        fontWeight: '700',
                        fontSize: '10px'
                      }}
                    >
                      {b.name[0]}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      b/{b.name}
                    </span>
                  </Link>
                ))
              )}
            </div>

            {canModerate && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                <Link
                  to="/community/mod-queue"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'rgba(255, 106, 44, 0.06)',
                    border: '1px solid rgba(255, 106, 44, 0.18)',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 106, 44, 0.12)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 106, 44, 0.06)'
                  }}
                >
                  <div 
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '9999px',
                      background: 'var(--accent)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px'
                    }}
                  >
                    🛡️
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)' }}>
                    Moderator Queue
                  </span>
                </Link>
              </>
            )}
          </div>
        )}

        {/* Center Feed Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Feed Filter Sort Bar */}
          <div 
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-card)',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSort('hot')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all var(--transition-fast) ease',
                  background: sort === 'hot' ? 'var(--accent)' : 'transparent',
                  color: sort === 'hot' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                🔥 Hot
              </button>
              <button
                onClick={() => setSort('new')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all var(--transition-fast) ease',
                  background: sort === 'new' ? 'var(--accent)' : 'transparent',
                  color: sort === 'new' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                ✨ New
              </button>
              <button
                onClick={() => setSort('top')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all var(--transition-fast) ease',
                  background: sort === 'top' ? 'var(--accent)' : 'transparent',
                  color: sort === 'top' ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                📈 Top
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', paddingRight: '8px' }}>
              {posts.length} loaded
            </div>
          </div>

          {/* Feed Content Loader */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '30vh' }}>
              <Spinner size="lg" />
            </div>
          ) : posts.length === 0 ? (
            <div 
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '48px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px'
              }}
            >
              <svg style={{ width: '48px', height: '48px', color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
              </svg>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>No community posts yet</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Be the first to share suggestions or ask queries!</p>
              </div>
              <Button
                onClick={handleCreatePostClick}
                variant="primary"
                style={{
                  padding: '10px 24px',
                  height: '40px',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                  cursor: 'pointer',
                  fontWeight: '700',
                  boxShadow: '0 4px 14px rgba(255,106,44,0.35)'
                }}
              >
                Create Post
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {posts.map(post => (
                <div 
                  key={post.id} 
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '20px',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    overflow: 'hidden'
                  }}
                >
                  
                  {/* Left Vote Rails */}
                  <div 
                    style={{
                      background: 'rgba(255, 255, 255, 0.01)',
                      width: '48px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '16px 0',
                      borderRight: '1px solid var(--border)',
                      flexShrink: 0
                    }}
                  >
                    <button
                      onClick={() => handleVote(post.id, 1, post.user_vote)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '8px',
                        transition: 'all var(--transition-fast) ease',
                        color: post.user_vote === 1 ? 'var(--accent)' : 'var(--text-tertiary)'
                      }}
                    >
                      ▲
                    </button>
                    <span 
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        fontFamily: 'var(--font-mono)',
                        margin: '4px 0',
                        color: post.user_vote === 1 ? 'var(--accent)' : post.user_vote === -1 ? 'var(--danger)' : 'var(--text-secondary)'
                      }}
                    >
                      {post.score}
                    </span>
                    <button
                      onClick={() => handleVote(post.id, -1, post.user_vote)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '8px',
                        transition: 'all var(--transition-fast) ease',
                        color: post.user_vote === -1 ? 'var(--danger)' : 'var(--text-tertiary)'
                      }}
                    >
                      ▼
                    </button>
                  </div>

                  {/* Main content area */}
                  <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                    
                    {/* Header info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {post.Board && (
                        <Link to={`/community/b/${post.Board.name}`} style={{ fontWeight: '700', color: 'var(--accent)', textDecoration: 'none' }}>
                          b/{post.Board.name}
                        </Link>
                      )}
                      <span>•</span>
                      <span>Posted by</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Avatar
                          src={post.User?.Profile?.avatar_url}
                          name={post.User?.Profile?.name || 'Explorer'}
                          size="xs"
                          gender={post.User?.Profile?.gender}
                        />
                        <Link to={`/profile/${post.user_id}`} style={{ fontWeight: '600', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                          {post.User?.Profile?.name || 'Explorer'}
                        </Link>
                        <span style={{ background: 'var(--moss-soft)', color: 'var(--moss)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                          ★ {post.User?.trust_score ?? 50}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <Link to={`/community/post/${post.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h2 
                        style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          lineHeight: '1.4',
                          fontFamily: 'var(--font-display)',
                          color: 'var(--text-primary)',
                          margin: 0
                        }}
                      >
                        {post.title}
                      </h2>
                    </Link>

                    {/* Short content excerpt */}
                    {post.content && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.content}
                      </p>
                    )}

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                      <Link
                        to={`/community/post/${post.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          textDecoration: 'none',
                          padding: '6px 12px',
                          borderRadius: '10px',
                          transition: 'background var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-raised)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg style={{ width: '16px', height: '16px', color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>{post.comment_count} replies</span>
                      </Link>

                      <button
                        onClick={() => handleSave(post.id, post.is_saved)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          marginLeft: 'auto',
                          padding: '6px 12px',
                          borderRadius: '10px',
                          color: post.is_saved ? 'var(--accent)' : 'var(--text-secondary)',
                          fontWeight: post.is_saved ? '600' : 'normal',
                          transition: 'background var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-raised)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg style={{ width: '16px', height: '16px' }} fill={post.is_saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.022H6.407a1.69 1.69 0 00-1.688 1.69v16.14l7.281-4.708 7.281 4.708V4.712a1.69 1.69 0 00-1.688-1.69z" />
                        </svg>
                        <span>{post.is_saved ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
              <Button
                onClick={() => fetchPosts(cursor, true)}
                loading={loadingMore}
                variant="secondary"
                style={{
                  padding: '10px 32px',
                  height: '44px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface-raised)',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Load More
              </Button>
            </div>
          )}

        </div>

        {/* Right Column: Sidebar */}
        {isDesktop && (
          <div 
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-card)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              textAlign: 'left'
            }}
          >
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '6px', marginTop: 0 }}>
                Guidelines
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                Please respect local cultures and rules when exchanging destination guidelines. Keep the vibe constructive!
              </p>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '4px', marginTop: 0 }}>
                Popular Destinations
              </h4>
              <Link to="/community/b/himachal-treks" style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500' }} onMouseEnter={(e) => e.target.style.color = 'var(--accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>b/himachal-treks</Link>
              <Link to="/community/b/goa-beaches" style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500' }} onMouseEnter={(e) => e.target.style.color = 'var(--accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>b/goa-beaches</Link>
              <Link to="/community/b/nepal-trails" style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '500' }} onMouseEnter={(e) => e.target.style.color = 'var(--accent)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>b/nepal-trails</Link>
            </div>
          </div>
        )}

      </div>

      {/* Auth interception modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default CommunityFeed
