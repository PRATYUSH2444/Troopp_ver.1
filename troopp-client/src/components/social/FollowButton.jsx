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
      className={`h-8 px-3.5 rounded-lg text-[10px] font-extrabold transition-all shadow-sm ${
        isFollowing
          ? 'bg-stone-150 border border-stone-250 text-text-secondary hover:bg-stone-200/50'
          : 'bg-primary text-white hover:bg-primary-dark'
      }`}
    >
      {isFollowing ? '✓ Following' : '＋ Follow'}
    </button>
  )
}

export default FollowButton
export { FollowButton }
