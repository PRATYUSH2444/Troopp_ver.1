import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Avatar from '../../components/common/Avatar.jsx'
import FollowButton from '../../components/social/FollowButton.jsx'
import Spinner from '../../components/common/Spinner.jsx'

/**
 * List followers of a specific user.
 */
const FollowersListPage = () => {
  const { userId } = useParams()
  const [loading, setLoading] = useState(true)
  const [followers, setFollowers] = useState([])

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        // Mock fetch list: axios.get(`/api/v1/follows/${userId}/followers`)
        await new Promise((r) => setTimeout(r, 450))

        setFollowers([
          {
            userId: 'user-2',
            name: 'Priya Sharma',
            avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
            trustScore: 72,
            isFollowing: true
          },
          {
            userId: 'user-3',
            name: 'Vikram Malhotra',
            avatarUrl: null,
            trustScore: 55,
            isFollowing: false
          }
        ])
      } catch (err) {
        console.error('Failed retrieving followers list:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFollowers()
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-20 px-4">
      {/* Header back button */}
      <div className="flex items-center gap-3 mt-4">
        <Link
          to={`/profile/${userId}`}
          className="w-10 h-10 border border-border rounded-xl hover:bg-stone-50 flex items-center justify-center text-xs font-bold"
        >
          ←
        </Link>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-secondary uppercase">Social Connection</span>
          <h2 className="text-sm font-extrabold text-text-primary">
            Followers
          </h2>
        </div>
      </div>

      {followers.length === 0 ? (
        <div className="text-center py-20 bg-stone-50/50 border border-border/80 border-dashed rounded-2xl flex flex-col items-center gap-2">
          <span className="text-2xl">👥</span>
          <h4 className="text-xs font-bold text-text-primary">No followers yet</h4>
          <p className="text-[10px] text-text-secondary max-w-xs leading-relaxed">
            When other travelers start following this explorer's weekend getaways, they will list up here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {followers.map((item) => (
            <div
              key={item.userId}
              className="bg-surface border border-border/80 p-3.5 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar src={item.avatarUrl} name={item.name} size="sm" score={item.trustScore} />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary">{item.name}</span>
                  <span className="text-[9px] text-text-secondary mt-0.5">Trust Score: {item.trustScore}</span>
                </div>
              </div>

              {/* Optimistic toggle follow */}
              <FollowButton targetUserId={item.userId} initialIsFollowing={item.isFollowing} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FollowersListPage
export { FollowersListPage }
