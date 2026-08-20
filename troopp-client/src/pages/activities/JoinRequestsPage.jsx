import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { apiRequest } from '../../utils/api.js'
import { haptics } from '../../utils/haptics.js'
import Avatar from '../../components/common/Avatar.jsx'
import MemberTrustCard from '../../components/trust/MemberTrustCard.jsx'
import Spinner from '../../components/common/Spinner.jsx'

const JoinRequestsPage = () => {
  const { id } = useParams()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState(null)

  // Trust Card selection
  const [selectedUser, setSelectedUser] = useState(null)
  const [trustCardOpen, setTrustCardOpen] = useState(false)
  const [isBackHovered, setIsBackHovered] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const actRes = await apiRequest(`/activities/${id}`)
      if (actRes.ok) {
        const actJson = await actRes.json()
        setActivity(actJson.data)
      } else {
        toast.error('Failed to load trip details.')
      }

      const reqRes = await apiRequest(`/activities/${id}/requests`)
      if (reqRes.ok) {
        const reqJson = await reqRes.json()
        setRequests(reqJson.data || [])
      } else {
        toast.error('Failed to load pending requests.')
      }
    } catch (err) {
      console.error('Failed loading requests data:', err)
      toast.error('Error connecting to server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleAction = async (requestId, action) => {
    if (!requestId) return
    haptics.lightTap()
    try {
      const res = await apiRequest(`/activities/${id}/requests/${requestId}/${action}`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (res.ok) {
        if (action === 'approve') {
          import('../../utils/sounds.js').then((m) => m.playJoinApproved())
          toast.success('Traveler approved successfully!')
          setActivity((prev) => ({
            ...prev,
            current_members: Math.min(prev.max_group_size, prev.current_members + 1)
          }))
        } else {
          import('../../utils/sounds.js').then((m) => m.playError())
          toast.success('Join request declined.')
        }
        
        // Slide out card from list
        setRequests((prev) => prev.filter((r) => r.id !== requestId))
        setTrustCardOpen(false)
        setSelectedUser(null)
      } else {
        toast.error(data.error?.message || `Failed to ${action} request.`)
      }
    } catch (err) {
      console.error(`Error performing action ${action}:`, err)
      toast.error('Server error encountered.')
    }
  }

  const openTrustCard = async (reqUser) => {
    haptics.lightTap()
    try {
      const res = await apiRequest(`/activities/users/${reqUser.User?.id || reqUser.user_id}/trust-card`)
      if (res.ok) {
        const json = await res.json()
        setSelectedUser({
          ...json.data,
          id: reqUser.id, // the member request ID for approvals!
          last_traveled_date: 'N/A'
        })
        setTrustCardOpen(true)
      } else {
        toast.error('Failed to load trust card details.')
      }
    } catch (err) {
      console.error('Error fetching trust card details:', err)
      toast.error('Failed to connect to server.')
    }
  }

  if (loading && !activity) {
    return (
      <div style={{ minHeight: '100vh', background: '#10151a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  const fillPct = activity ? Math.min(100, (activity.current_members / activity.max_group_size) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#10151a', padding: '28px 24px 80px', color: 'var(--text-primary)' }}>
      <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Back button and title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', userSelect: 'none' }}>
          <Link
            to={`/activities/${id}`}
            onMouseEnter={() => setIsBackHovered(true)}
            onMouseLeave={() => setIsBackHovered(false)}
            style={{
              padding: '8px 16px',
              background: isBackHovered ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.14)',
              color: isBackHovered ? '#f3f1ea' : '#9ba6ad',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            ← Back
          </Link>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Host Dashboard</span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
              Pending Join Requests
            </h2>
          </div>
        </div>

        {/* Spots indicator */}
        {activity && (
          <div style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Confirmed Participants</span>
              <span style={{ color: 'var(--moss)' }}>
                {activity.current_members} of {activity.max_group_size} slots filled
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#10151a', borderRadius: '100px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div
                style={{
                  height: '100%',
                  background: 'var(--moss)',
                  width: `${fillPct}%`,
                  borderRadius: '100px',
                  transition: 'width 300ms ease'
                }}
              />
            </div>
          </div>
        )}

        {/* Requests List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '32px' }}>👥</span>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>No pending requests</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>All applications have been processed for this trip.</p>
            </div>
          ) : (
            <AnimatePresence>
              {requests.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, scale: 0.95, transition: { duration: 0.2 } }}
                >
                  <RequestCard
                    req={req}
                    handleAction={handleAction}
                    openTrustCard={openTrustCard}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Detailed Member Trust Card Modal overlay */}
        <MemberTrustCard
          isOpen={trustCardOpen}
          onClose={() => setTrustCardOpen(false)}
          userData={selectedUser}
          viewMode="host"
          onAccept={() => handleAction(selectedUser?.id, 'approve')}
          onDecline={() => handleAction(selectedUser?.id, 'decline')}
        />
      </div>
    </div>
  )
}

const RequestCard = ({ req, handleAction, openTrustCard }) => {
  const [dragX, setDragX] = useState(0)
  const [isAuditHovered, setIsAuditHovered] = useState(false)
  const [isDeclineHovered, setIsDeclineHovered] = useState(false)
  const [isApproveHovered, setIsApproveHovered] = useState(false)

  const profile = req.User?.Profile || {}
  const user = req.User || {}

  return (
    <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}>
      {/* Slide backgrounds */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', pointerEvents: 'none', zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--moss)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '24px',
            opacity: dragX > 0 ? Math.min(dragX / 100, 1) : 0,
            transition: 'opacity 150ms ease'
          }}
        >
          ✓ Accept
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '24px',
            opacity: dragX < 0 ? Math.min(-dragX / 100, 1) : 0,
            transition: 'opacity 150ms ease'
          }}
        >
          Decline ✕
        </div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.4}
        onDrag={(e, info) => setDragX(info.offset.x)}
        onDragEnd={(e, info) => {
          setDragX(0)
          if (info.offset.x > 100) {
            handleAction(req.id, 'approve')
          } else if (info.offset.x < -100) {
            handleAction(req.id, 'decline')
          }
        }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'grab',
          background: 'var(--surface-raised)',
          position: 'relative',
          zIndex: 10,
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Avatar src={profile.avatar_url} name={profile.name || 'Traveler'} size="md" score={user.trust_score || 50} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {profile.name || 'Anonymous Traveler'}
              </span>
              {req.role && req.role !== 'member' && (
                <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' }}>
                  {req.role}
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Trust: <span style={{ color: 'var(--moss)', fontWeight: '700' }}>{user.trust_score || 50}</span> · Reliability: <span style={{ color: 'var(--moss)', fontWeight: '700' }}>{user.reliability_score || 100}%</span>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => openTrustCard(req)}
            onMouseEnter={() => setIsAuditHovered(true)}
            onMouseLeave={() => setIsAuditHovered(false)}
            style={{
              height: '32px',
              padding: '0 12px',
              background: isAuditHovered ? 'rgba(255,255,255,0.06)' : 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            Audit
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => handleAction(req.id, 'decline')}
              onMouseEnter={() => setIsDeclineHovered(true)}
              onMouseLeave={() => setIsDeclineHovered(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: isDeclineHovered ? 'rgba(239,83,80,0.15)' : 'rgba(239,83,80,0.08)',
                border: 'none',
                color: '#ef5350',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transition: 'all 150ms ease'
              }}
              title="Decline request"
            >
              ✕
            </button>
            <button
              onClick={() => handleAction(req.id, 'approve')}
              onMouseEnter={() => setIsApproveHovered(true)}
              onMouseLeave={() => setIsApproveHovered(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: isApproveHovered ? 'rgba(79,190,142,0.15)' : 'rgba(79,190,142,0.08)',
                border: 'none',
                color: 'var(--moss)',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transition: 'all 150ms ease'
              }}
              title="Approve request"
            >
              ✓
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default JoinRequestsPage
