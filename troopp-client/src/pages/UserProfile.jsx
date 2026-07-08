import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Avatar from '../components/common/Avatar.jsx'
import FollowButton from '../components/social/FollowButton.jsx'
import { ProfileSkeleton } from '../components/common/Skeleton.jsx'
import { haptics } from '../utils/haptics.js'
import { apiRequest } from '../utils/api.js'

/**
 * Public User Profile page showing trust score stats, followers details, 
 * and actions like follow and block.
 */
const UserProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()

  // State managers
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  
  // Menu/Modal UI State
  const [menuOpen, setMenuOpen] = useState(false)
  const [sharedTripsPrompt, setSharedTripsPrompt] = useState([])
  const [blockPromptOpen, setBlockPromptOpen] = useState(false)
  
  const [isBackHovered, setIsBackHovered] = useState(false)
  const [isDotsHovered, setIsDotsHovered] = useState(false)
  const [hoveredMenuItem, setHoveredMenuItem] = useState(null)
  const [isCloseHovered, setIsCloseHovered] = useState(false)
  const [hoveredTripId, setHoveredTripId] = useState(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await apiRequest(`/profiles/${userId}`)
        if (!res.ok) {
          throw new Error('Failed to retrieve traveler profile.')
        }
        const json = await res.json()
        setProfileData(json.data)
      } catch (err) {
        console.error('Failed retrieving user profile:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUserProfile()
  }, [userId])

  const handleBlockUser = async () => {
    setMenuOpen(false)
    try {
      // Mock dispatch block: axios.post(`/api/v1/blocks/${userId}`)
      await new Promise((r) => setTimeout(r, 400))
      
      // Simulated response showing shared future trips to prompt
      const mockSharedTrips = [
        { id: 'trip-101', title: 'Monsoon Devkund Waterfall Trek', date_time: '2026-07-22T06:00:00Z' }
      ]

      if (mockSharedTrips.length > 0) {
        setSharedTripsPrompt(mockSharedTrips)
        setBlockPromptOpen(true)
      } else {
        alert('User blocked successfully. Unfollowing linkages updated.')
        navigate('/feed')
      }
    } catch (err) {
      console.error('Failed blocking user:', err)
    }
  }

  const handleWithdrawFromTrip = async (tripId) => {
    try {
      // Mock withdraw dispatch: axios.delete(`/api/v1/activities/${tripId}/withdraw`)
      await new Promise((r) => setTimeout(r, 300))
      setSharedTripsPrompt((prev) => prev.filter((t) => t.id !== tripId))
      alert('Withdrawn from shared trip successfully.')
    } catch (err) {
      console.error('Failed withdrawing from trip:', err)
    }
  }

  if (loading) {
    return <ProfileSkeleton />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#10151a', paddingBottom: '80px' }}>
      <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
        
        {/* Top Banner Area */}
        <div
          style={{
            height: '160px',
            background: 'linear-gradient(160deg, #1c2a2a 0%, #1a2129 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            margin: '0 -24px',
            borderRadius: '0 0 24px 24px',
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '20px 24px 0',
            userSelect: 'none'
          }}
        >
          <button
            onClick={() => navigate(-1)}
            onMouseEnter={() => setIsBackHovered(true)}
            onMouseLeave={() => setIsBackHovered(false)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: isBackHovered ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.14)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              cursor: 'pointer',
              transition: 'background 150ms ease'
            }}
          >
            ←
          </button>

          {/* Actions menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              onMouseEnter={() => setIsDotsHovered(true)}
              onMouseLeave={() => setIsDotsHovered(false)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                background: isDotsHovered ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.14)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                cursor: 'pointer',
                transition: 'background 150ms ease'
              }}
            >
              ⋮
            </button>
            
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  marginTop: '8px',
                  width: '144px',
                  background: '#1a2129',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
                  padding: '4px 0',
                  zIndex: 30
                }}
              >
                <button
                  onClick={handleBlockUser}
                  onMouseEnter={() => setHoveredMenuItem('block')}
                  onMouseLeave={() => setHoveredMenuItem(null)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: hoveredMenuItem === 'block' ? 'rgba(255,84,112,0.08)' : 'transparent',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#ff5470',
                    cursor: 'pointer'
                  }}
                >
                  🚫 Block traveler
                </button>
                <button
                  onClick={() => {
                    alert('Report filed successfully.')
                    setMenuOpen(false)
                  }}
                  onMouseEnter={() => setHoveredMenuItem('report')}
                  onMouseLeave={() => setHoveredMenuItem(null)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: hoveredMenuItem === 'report' ? 'rgba(255,255,255,0.03)' : 'transparent',
                    border: 'none',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#9ba6ad',
                    cursor: 'pointer'
                  }}
                >
                  ⚠️ Report Traveler
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile avatar metadata row */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '-64px', position: 'relative', zIndex: 10, textAlign: 'center', gap: '6px', padding: '0 16px', userSelect: 'none' }}>
          <Avatar src={profileData.avatarUrl} name={profileData.name} size="lg" score={profileData.trustScore} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: '#f3f1ea', margin: 0 }}>
              {profileData.name}
            </h3>
            {profileData.idVerified ? (
              <span 
                style={{ 
                  fontSize: '11px', 
                  color: profileData.trustScore >= 75 ? '#4fbe8e' : '#3b82f6', 
                  fontWeight: '700', 
                  padding: '2px 8px', 
                  background: profileData.trustScore >= 75 ? 'rgba(79, 190, 142, 0.14)' : 'rgba(59, 130, 246, 0.14)', 
                  borderRadius: '100px' 
                }} 
                title={profileData.trustScore >= 75 ? 'Trusted Legend' : 'Verified Explorer'}
              >
                {profileData.trustScore >= 75 ? '👑 Trusted' : '🛡️ Verified'}
              </span>
            ) : (
              <span 
                style={{ 
                  fontSize: '11px', 
                  color: '#6b757c', 
                  fontWeight: '700', 
                  padding: '2px 8px', 
                  background: 'rgba(107, 117, 124, 0.14)', 
                  borderRadius: '100px' 
                }}
                title="New Seed"
              >
                🌱 New Seed
              </span>
            )}
          </div>

          <p style={{ fontSize: '14px', color: '#9ba6ad', leadingHeight: '1.5', maxWidth: '360px', margin: '4px 0 0', fontStyle: 'italic' }}>
            "{profileData.bio}"
          </p>

          {/* Follow action button */}
          <div style={{ marginTop: '14px', width: '100%', maxWidth: '200px', display: 'flex', justifyContent: 'center' }}>
            <FollowButton targetUserId={userId} initialIsFollowing={profileData.isFollowing} />
          </div>
        </div>

        {/* Stats counter rows */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 0',
            textAlign: 'center',
            marginTop: '8px',
            userSelect: 'none'
          }}
        >
          <Link to={`/profile/${userId}/followers`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textDecoration: 'none' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Followers</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', color: '#f3f1ea', marginTop: '2px' }}>{profileData.followersCount}</span>
          </Link>
          <Link to={`/profile/${userId}/following`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Following</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', color: '#f3f1ea', marginTop: '2px' }}>{profileData.followingCount}</span>
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Trips Completed</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', color: '#f3f1ea', marginTop: '2px' }}>{profileData.tripsCompleted}</span>
          </div>
        </div>

        {/* Safety Score Snapshot Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', userSelect: 'none' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Safety Trust Score Card
          </span>
          <div
            style={{
              padding: '20px',
              background: '#1a2129',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#f3f1ea' }}>Trust Level Badge</span>
              <span style={{ fontSize: '12px', color: '#9ba6ad', lineHeight: '1.4', maxWidth: '340px' }}>
                Calculated based on past trip reports, attendance verification, and ratings.
              </span>
            </div>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '2px solid #4fbe8e',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1a2129',
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: '8px', fontWeight: '700', color: '#6b757c', leadingHeight: 1, textTransform: 'uppercase' }}>score</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#4fbe8e', fontFamily: 'var(--font-mono)' }}>{profileData.trustScore}</span>
            </div>
          </div>
        </div>

        {/* Shared trip prompts modal Dialog */}
        {blockPromptOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div
              style={{
                background: '#1a2129',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '24px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                userSelect: 'none'
              }}
            >
              <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#ff5470', margin: 0 }}>
                Blocked: Shared future trips found
              </h4>
              
              <p style={{ fontSize: '13px', color: '#9ba6ad', lineHeight: '1.5', margin: 0 }}>
                You blocked {profileData.name}. You both are currently registered as confirmed members in the following upcoming trips. You can choose to withdraw from them:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '144px', overflowY: 'auto', paddingRight: '4px' }}>
                {sharedTripsPrompt.map((trip) => {
                  const isHovered = hoveredTripId === trip.id
                  return (
                    <div
                      key={trip.id}
                      style={{
                        background: '#212b33',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '12px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1 }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#f3f1ea', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {trip.title}
                        </span>
                        <span style={{ fontSize: '11px', color: '#6b757c', marginTop: '2px' }}>
                          {new Date(trip.date_time).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <button
                        onClick={() => handleWithdrawFromTrip(trip.id)}
                        onMouseEnter={() => setHoveredTripId(trip.id)}
                        onMouseLeave={() => setHoveredTripId(null)}
                        style={{
                          padding: '6px 12px',
                          background: '#ff5470',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(255,84,112,0.2)'
                        }}
                      >
                        Withdraw
                      </button>
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <button
                  onClick={() => {
                    setBlockPromptOpen(false)
                    navigate('/feed')
                  }}
                  onMouseEnter={() => setIsCloseHovered(true)}
                  onMouseLeave={() => setIsCloseHovered(false)}
                  style={{
                    width: '100%',
                    height: '40px',
                    background: isCloseHovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'background 150ms ease'
                  }}
                >
                  Keep Remaining / Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile
export { UserProfile }
