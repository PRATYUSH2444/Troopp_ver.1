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
            background: 'linear-gradient(160deg, #10151a 0%, #161d24 100%)',
            backgroundImage: 'repeating-radial-gradient(circle at 82% 20%, transparent 0, transparent 18px, rgba(79,190,142,0.06) 19px, transparent 20px), repeating-radial-gradient(circle at 82% 20%, transparent 0, transparent 42px, rgba(79,190,142,0.04) 43px, transparent 44px), linear-gradient(160deg, #161d24 0%, #10151a 100%)',
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
          <Avatar src={profileData.avatarUrl} name={profileData.name} size="lg" score={profileData.trustScore} showStatusRing={true} />
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: profileData.trustScore >= 75 ? 'var(--moss)' : 'var(--accent)',
                background: profileData.trustScore >= 75 ? 'var(--moss-soft)' : 'var(--accent-soft)',
                padding: '4px 10px',
                borderRadius: '100px'
              }}
            >
              {profileData.trustScore >= 75 ? '👑 TRUSTED TRAVELER' : '🛡️ EXPLORER'}
            </span>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', margin: '4px 0 0' }}>
              {profileData.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span 
                style={{ 
                  fontSize: '11px', 
                  color: (profileData.reliabilityBreakdown?.completedTrips || 0) === 0 ? 'var(--amber)' : profileData.trustScore >= 75 ? 'var(--moss)' : 'var(--accent)', 
                  fontWeight: '700', 
                  padding: '3px 10px', 
                  background: (profileData.reliabilityBreakdown?.completedTrips || 0) === 0 ? 'var(--amber-soft)' : profileData.trustScore >= 75 ? 'var(--moss-soft)' : 'var(--accent-soft)', 
                  borderRadius: '100px',
                  border: '1px solid rgba(255,255,255,0.04)'
                }} 
              >
                {(profileData.reliabilityBreakdown?.completedTrips || 0) === 0 ? '🌱 Basecamp Newbie' : profileData.trustScore >= 75 ? '👑 Trusted' : '🛡️ Explorer'}
              </span>

              {profileData.gender && profileData.gender !== 'prefer_not_to_say' && (
                <span 
                  style={{ 
                    fontSize: '11px', 
                    color: 'var(--text-secondary)', 
                    fontWeight: '600', 
                    padding: '3px 10px', 
                    background: 'var(--surface-raised)', 
                    borderRadius: '100px',
                    border: '1px solid var(--border)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }} 
                >
                  {profileData.gender.toLowerCase() === 'male' ? '👨 Male' : 
                   profileData.gender.toLowerCase() === 'female' ? '👩 Female' : 
                   profileData.gender.toLowerCase() === 'non-binary' ? '🧑 Non-Binary' : 
                   `🧑 ${profileData.gender}`}
                </span>
              )}
            </div>
          </div>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', maxWidth: '360px', margin: '8px 0 0', fontStyle: 'italic' }}>
            "{profileData.bio}"
          </p>

          {/* Follow action button */}
          <div style={{ marginTop: '14px', width: '100%', maxWidth: '200px', display: 'flex', justifyContent: 'center' }}>
            <FollowButton targetUserId={userId} initialIsFollowing={profileData.isFollowing} />
          </div>
        </div>

        {/* Stats card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '16px',
            textAlign: 'center',
            marginTop: '8px',
            boxShadow: 'var(--shadow-card)',
            userSelect: 'none'
          }}
        >
          <Link to={`/profile/${userId}/followers`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textDecoration: 'none' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Followers</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>{profileData.followersCount}</span>
          </Link>
          <Link to={`/profile/${userId}/following`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', textDecoration: 'none' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Following</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>{profileData.followingCount}</span>
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trips Completed</span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>{profileData.tripsCompleted}</span>
          </div>
        </div>

        {/* Safety & Reliability Summary Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', userSelect: 'none' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            🛡️ Safety & Reliability Summary
          </span>
          <div style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-card)', display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
            {/* Peer Trust Index */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '2px solid var(--moss)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--moss-soft)',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--moss)', fontFamily: 'var(--font-mono)' }}>{profileData.trustScore}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Peer Trust Index</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Community reputation</span>
              </div>
            </div>

            {/* Reliability Score */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '2px solid var(--moss)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--moss-soft)',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: (profileData.reliabilityBreakdown?.completedTrips || 0) === 0 ? '9px' : '14px', fontWeight: '700', color: 'var(--moss)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                  {(profileData.reliabilityBreakdown?.completedTrips || 0) === 0 ? 'New' : `${profileData.reliabilityScore}%`}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Reliability</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  {(profileData.reliabilityBreakdown?.completedTrips || 0) === 0 ? 'No N8 trips yet' : 'Attendance commitment'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance History Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', userSelect: 'none' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            📅 Attendance History
          </span>
          <div style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Attended</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--moss)' }}>{profileData.reliabilityBreakdown?.completedTrips || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cancellations</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--danger)' }}>{profileData.reliabilityBreakdown?.lateCancellations || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>No-shows</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--danger)' }}>{profileData.reliabilityBreakdown?.noShows || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', userSelect: 'none' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            🛡️ Emergency Contacts
          </span>
          <div style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-card)' }}>
            {profileData.isAuthorizedForEmergency ? (
              profileData.emergencyContacts && profileData.emergencyContacts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profileData.emergencyContacts.map((contact) => (
                    <div key={contact.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{contact.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>Relationship: {contact.relationship || 'Secondary'}</span>
                      </div>
                      <a href={`tel:${contact.phone}`} style={{ textDecoration: 'none', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent-soft)', padding: '6px 12px', borderRadius: '100px', border: '1px solid rgba(255,106,44,0.15)', fontSize: '12px' }}>
                        📞 {contact.phone}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '8px 0', textAlign: 'center' }}>
                  No emergency contacts listed by this traveler.
                </div>
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>🔒</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Restricted</span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  For traveler safety and privacy, emergency contacts are only visible to confirmed co-travelers sharing an active trip.
                </p>
              </div>
            )}
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
