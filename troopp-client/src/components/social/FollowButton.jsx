import React, { useState } from 'react'

/**
 * Social Follow/Unfollow button with optimistic state UI toggling.
 */
const FollowButton = ({ targetUserId, initialIsFollowing = false }) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)

  const handleFollowClick = async (e) => {
    e.stopPropagation() // Prevent card click triggers
    if (loading) return

    // 1. Optimistic UI Update
    const prevStatus = isFollowing
    setIsFollowing(!prevStatus)
    setLoading(true)

    try {
      if (prevStatus) {
        // Dispatch Unfollow: axios.delete(`/api/v1/follows/${targetUserId}`)
        await new Promise((r) => setTimeout(r, 300))
      } else {
        // Dispatch Follow: axios.post(`/api/v1/follows/${targetUserId}`)
        await new Promise((r) => setTimeout(r, 300))
      }
    } catch (err) {
      console.error('Follow request failed:', err)
      // Rollback to previous state on failure
      setIsFollowing(prevStatus)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleFollowClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '38px',
        padding: '0 24px',
        borderRadius: '100px',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        boxSizing: 'border-box',
        ...(isFollowing ? {
          background: 'transparent',
          color: 'var(--accent)',
          border: '1.5px solid var(--accent)',
        } : {
          background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
          color: '#1a0e08',
          border: 'none',
          boxShadow: '0 4px 12px rgba(255, 106, 44, 0.2)'
        })
      }}
      onMouseEnter={(e) => {
        if (isFollowing) {
          e.currentTarget.style.background = 'var(--accent-soft)'
        } else {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 106, 44, 0.3)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        if (isFollowing) {
          e.currentTarget.style.background = 'transparent'
        } else {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 106, 44, 0.2)'
        }
      }}
    >
      {isFollowing ? '✓ Following' : '＋ Follow'}
    </button>
  )
}

export default FollowButton
export { FollowButton }
