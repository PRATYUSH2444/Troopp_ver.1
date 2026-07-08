import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        await new Promise((r) => setTimeout(r, 600)) // Latency simulation

        setActivity({
          id,
          title: 'Harishchandragad Monsoon Trek & Night Camping',
          max_group_size: 12,
          current_members: 8
        })

        const mockRequests = [
          {
            id: 'req-1',
            user_id: 'user-2',
            name: 'Priya Sharma',
            avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
            trust_score: 72,
            reliability_score: 98,
            is_id_verified: true,
            is_face_verified: true,
            trips_completed: 4,
            positive_rating_pct: 100,
            tenure_months: 2,
            has_valid_reports: false,
            last_traveled_date: '10 May 2026',
            mutual_connections: ['Amit Patel']
          },
          {
            id: 'req-2',
            user_id: 'user-3',
            name: 'Vikram Malhotra',
            avatar_url: null,
            trust_score: 55,
            reliability_score: 85,
            is_id_verified: true,
            is_face_verified: false,
            trips_completed: 2,
            positive_rating_pct: 90,
            tenure_months: 1,
            has_valid_reports: false,
            last_traveled_date: '28 Apr 2026',
            mutual_connections: []
          }
        ]
        setRequests(mockRequests)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [id])

  const handleAction = async (requestId, action) => {
    // action: 'approve' | 'decline'
    try {
      // Mock API trigger: axios.post(`/api/v1/activities/${id}/requests/${requestId}/${action}`)
      await new Promise((r) => setTimeout(r, 500))

      if (action === 'approve') {
        import('../../utils/sounds.js').then((m) => m.playJoinApproved())
        setActivity((prev) => ({
          ...prev,
          current_members: Math.min(prev.max_group_size, prev.current_members + 1)
        }))
      } else if (action === 'decline') {
        import('../../utils/sounds.js').then((m) => m.playError())
      }

      // Slide out card from feed
      setRequests((prev) => prev.filter((r) => r.id !== requestId))
      setTrustCardOpen(false)
      setSelectedUser(null)
    } catch (e) {
      console.error(e)
    }
  }

  const openTrustCard = (user) => {
    setSelectedUser(user)
    setTrustCardOpen(true)
  }

  if (loading && !activity) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 pb-20">
      {/* Back button and title */}
      <div className="flex items-center gap-3">
        <Link
          to={`/activities/${id}`}
          className="w-10 h-10 border border-border rounded-xl hover:bg-stone-50 flex items-center justify-center text-xs font-bold"
        >
          ←
        </Link>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-secondary uppercase">Host Dashboard</span>
          <h2 className="text-base font-extrabold text-text-primary">
            Pending Join Requests
          </h2>
        </div>
      </div>

      {/* Spots indicator */}
      <div className="glass-card p-4 flex flex-col gap-2 shadow-sm">
        <div className="flex justify-between items-center text-xs font-bold text-text-secondary">
          <span>Confirmed Participants</span>
          <span>
            {activity.current_members} of {activity.max_group_size} slots filled
          </span>
        </div>
        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(activity.current_members / activity.max_group_size) * 100}%` }}
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="flex flex-col gap-3">
        {requests.length === 0 ? (
          <div className="text-center py-20 bg-surface border border-border/80 rounded-2xl flex flex-col items-center gap-2">
            <span className="text-3xl">👥</span>
            <h4 className="text-sm font-bold text-text-primary">No pending requests</h4>
            <p className="text-xs text-text-secondary">All applications have been processed for this trip.</p>
          </div>
        ) : (
          <AnimatePresence>
            {requests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, scale: 0.9, transition: { duration: 0.25 } }}
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
  )
}

const RequestCard = ({ req, handleAction, openTrustCard }) => {
  const [dragX, setDragX] = useState(0)

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm">
      {/* Slide backgrounds */}
      <div className="absolute inset-0 flex items-center justify-between text-white font-black text-xs uppercase tracking-wider z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-emerald-500 flex items-center pl-6 transition-opacity"
          style={{ opacity: dragX > 0 ? Math.min(dragX / 100, 1) : 0 }}
        >
          ✓ Accept
        </div>
        <div
          className="absolute inset-0 bg-rose-500 flex items-center justify-end pr-6 transition-opacity"
          style={{ opacity: dragX < 0 ? Math.min(-dragX / 100, 1) : 0 }}
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
        className="glass-card p-4 flex items-center justify-between cursor-grab active:cursor-grabbing border border-border/60 hover:border-border transition-colors select-none relative z-10 bg-white"
      >
        <div className="flex items-center gap-3">
          <Avatar src={req.avatar_url} name={req.name} size="md" score={req.trust_score} />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-text-primary leading-tight">
              {req.name}
            </span>
            <span className="text-[9px] text-text-secondary leading-normal mt-0.5">
              Trust: {req.trust_score} · Reliability: {req.reliability_score}% · Trips: {req.trips_completed}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openTrustCard(req)}
            className="h-8 px-3 border border-border rounded-xl text-[10px] font-bold text-text-secondary hover:bg-stone-50"
          >
            Audit
          </button>
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => handleAction(req.id, 'decline')}
              className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 flex items-center justify-center text-xs"
              title="Decline request"
            >
              ✕
            </button>
            <button
              onClick={() => handleAction(req.id, 'approve')}
              className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 flex items-center justify-center text-xs"
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
export { JoinRequestsPage }
