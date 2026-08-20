import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../../utils/api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AuthModal from '../../components/auth/AuthModal.jsx'
import Button from '../../components/common/Button.jsx'
import Spinner from '../../components/common/Spinner.jsx'
import Avatar from '../../components/common/Avatar.jsx'
import { haptics } from '../../utils/haptics.js'

const BoardFeed = () => {
  const { boardName } = useParams()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // State
  const [board, setBoard] = useState(null)
  const [posts, setPosts] = useState([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subRole, setSubRole] = useState(null)
  const [sort, setSort] = useState('hot')
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  // Auth Modal State
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
      let url = `/community/posts?board_name=${boardName}&sort=${sort}&limit=10`
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
    haptics.impactLight()
    if (!isAuthenticated) {
      triggerAuthModal(handleSubscribeToggle)
      return
    }

    const previousState = isSubscribed
    setIsSubscribed(!previousState)

    try {
      if (previousState) {
        await apiRequest(`/community/boards/${boardName}/subscribe`, { method: 'DELETE' })
      } else {
        await apiRequest(`/community/boards/${boardName}/subscribe`, { method: 'POST' })
      }
      fetchBoardDetails()
    } catch (err) {
      console.error('Subscription failed:', err)
      setIsSubscribed(previousState)
    }
  }

  const handleVote = async (postId, value, currentVote) => {
    haptics.impactLight()
    if (!isAuthenticated) {
      triggerAuthModal(() => handleVote(postId, value, currentVote))
      return
    }

    const targetValue = currentVote === value ? 0 : value
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        let upvoteShift = 0
        let downvoteShift = 0
        if (currentVote === 1) upvoteShift -= 1
        if (currentVote === -1) downvoteShift -= 1
        if (targetValue === 1) upvoteShift += 1
        if (targetValue === -1) downvoteShift += 1
        return {
          ...p,
          user_vote: targetValue,
          score: p.score + (upvoteShift - downvoteShift)
        }
      }
      return p
    }))

    try {
      await apiRequest('/community/votes', {
        method: 'POST',
        body: JSON.stringify({ target_type: 'post', target_id: postId, vote_value: targetValue })
      })
    } catch (err) {
      console.error('Vote failed:', err)
      fetchBoardPosts(null, false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!board) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '16px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: 'var(--accent)' }}>Board Not Found</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>The community board b/{boardName} does not exist or was deleted.</p>
        <Button
          onClick={() => navigate('/community')}
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
          Back to Community Home
        </Button>
      </div>
    )
  }

  const gridTemplateColumns = isDesktop 
    ? '1fr 280px' 
    : '1fr'

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1300px', margin: '0 auto', selectNone: 'true' }}>
      
      {/* Board Banner Header */}
      <div className="hero-banner">
        <div className="hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '700',
                fontFamily: 'var(--font-display)',
                textTransform: 'uppercase',
                flexShrink: 0
              }}
            >
              {board.name[0]}
            </div>
            <div>
              <h1 className="hero-h1" style={{ fontSize: '24px', marginBottom: 0 }}>b/{board.name}</h1>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500', margin: 0 }}>
                {board.display_name} • {board.member_count} members
              </p>
            </div>
          </div>
          <p className="hero-p">{board.description || 'Welcome to the b/' + board.name + ' travel boards community.'}</p>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              onClick={handleSubscribeToggle}
              className="community-btn-secondary"
            >
              {isSubscribed ? `Joined (${subRole || 'member'})` : 'Join Board'}
            </button>
            <button
              onClick={() => navigate(`/community/submit?board=${board.name}`)}
              className="hero-cta"
              style={{
                background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                marginTop: 0
              }}
            >
              Submit Post +
            </button>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: gridTemplateColumns,
          gap: '24px',
          alignItems: 'start',
          width: '100%'
        }}
      >
        
        {/* Left Column: Posts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Sorting */}
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
            </div>
            <Link to="/community" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: '600', paddingRight: '8px' }}>
              Back to Home
            </Link>
          </div>

          {/* Posts list */}
          {postsLoading ? (
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
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>No discussions in b/{board.name} yet</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>Be the first to post guidelines or share updates!</p>
              <Button
                onClick={() => navigate(`/community/submit?board=${board.name}`)}
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
                  
                  {/* Vote rail */}
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
                        color: post.user_vote === 1 ? 'var(--accent)' : 'var(--text-tertiary)',
                        transition: 'color var(--transition-fast)'
                      }}
                    >
                      ▲
                    </button>
                    <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'var(--font-mono)', margin: '4px 0', color: 'var(--text-secondary)' }}>
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
                        color: post.user_vote === -1 ? 'var(--danger)' : 'var(--text-tertiary)',
                        transition: 'color var(--transition-fast)'
                      }}
                    >
                      ▼
                    </button>
                  </div>

                  {/* Body details */}
                  <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      <span>Posted by</span>
                      <Avatar
                        src={post.User?.Profile?.avatar_url}
                        name={post.User?.Profile?.name || 'Explorer'}
                        size="xs"
                        gender={post.User?.Profile?.gender}
                      />
                      <Link to={`/profile/${post.user_id}`} style={{ fontWeight: '600', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        {post.User?.Profile?.name || 'Explorer'}
                      </Link>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>

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
                        onMouseEnter={(e) => e.target.style.color = 'var(--accent)'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--text-primary)'}
                      >
                        {post.title}
                      </h2>
                    </Link>

                    {post.content && (
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.content}
                      </p>
                    )}

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
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{post.comment_count} replies</span>
                      </Link>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
              <Button
                onClick={() => fetchBoardPosts(cursor, true)}
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

        {/* Right Column: About Board Details */}
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
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '8px', marginTop: 0 }}>
                About b/{board.name}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px', marginTop: 0 }}>
                {board.description || 'Welcome to this local backpacking destination board.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Access rules:</span>
                  <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', fontWeight: '600' }}>{board.type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subscribers:</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{board.member_count}</span>
                </div>
              </div>
            </div>

            {board.rules && board.rules.length > 0 && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '10px', marginTop: 0 }}>
                    b/{board.name} Rules
                  </h4>
                  <ol style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {board.rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ol>
                </div>
              </>
            )}

            {board.flair_options && board.flair_options.length > 0 && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
                <div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '8px', marginTop: 0 }}>
                    Flairs
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {board.flair_options.map((flair, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '2px 10px',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: '700',
                          border: '1px solid transparent',
                          backgroundColor: `${flair.color || '#ff6a2c'}20`,
                          color: flair.color || '#ff6a2c'
                        }}
                      >
                        {flair.text}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>
        )}

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
