import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Avatar from '../../components/common/Avatar.jsx'
import GroupTrustSnapshot from '../../components/activity/GroupTrustSnapshot.jsx'
import PreJoinCheckGate from '../../components/join/PreJoinCheckGate.jsx'
import Spinner from '../../components/common/Spinner.jsx'

const ActivityDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // State Contexts
  const [activity, setActivity] = useState(null)
  const [confirmedMembers, setConfirmedMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [userJoinedStatus, setUserJoinedStatus] = useState('none') // 'none' | 'pending' | 'confirmed' | 'waitlisted'
  
  // Modals
  const [checkGateOpen, setCheckGateOpen] = useState(false)
  const [descExpanded, setDescExpanded] = useState(false)
  const [packingOpen, setPackingOpen] = useState(true)

  // Mock Active User profile for Safety Checks
  const activeUser = {
    id: 'user-me',
    name: 'Raj Malhotra',
    gender: 'male',
    trust_score: 80,
    reliability_score: 95,
    id_verified: true,
    has_emergency_contact: true
  }

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true)
      try {
        // Mock loading latency
        await new Promise((r) => setTimeout(r, 600))

        const mockDetail = {
          id,
          title: 'Harishchandragad Monsoon Trek & Night Camping',
          type: 'trek',
          description: 'Join us for one of the most scenic and thrilling monsoon treks in Maharashtra! We will ascend via the adventurous Khireshwar route, camp overnight near the Kokankada cliff to catch the sunrise, and descend the next morning. Packing essentials include raincoat, trekking shoes, water bottles, and energy bars.',
          date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          destination: 'Bhandardara, Maharashtra',
          cost_per_person: 1800,
          max_group_size: 12,
          current_members: 8,
          difficulty_level: 'hard',
          vibe_score_tag: '🏔️ Hardcore Adventurer',
          is_women_only: false,
          min_trust_score: 50,
          min_reliability_score: 80,
          packing_checklist: [
            { item: 'Trekking Shoes', qty: '1 pair', checked: false },
            { item: 'Raincoat / Poncho', qty: '1 unit', checked: false },
            { item: 'Sleeping Bag', qty: '1 unit', checked: false },
            { item: 'Flashlight', qty: '1 unit', checked: false }
          ],
          Creator: {
            id: 'creator-1',
            trust_score: 84,
            reliability_score: 95,
            is_id_verified: true,
            Profile: {
              name: 'Raj Malhotra',
              avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
              gender: 'male',
              bio: 'Avid mountaineer and explorer. Organised 15+ weekend treks around Mumbai and Pune.'
            }
          }
        }

        const mockMembers = [
          {
            user_id: 'creator-1',
            User: {
              trust_score: 84,
              Profile: {
                name: 'Raj Malhotra',
                avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
                gender: 'male'
              }
            }
          },
          {
            user_id: 'member-2',
            User: {
              trust_score: 72,
              Profile: {
                name: 'Priya Sharma',
                avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
                gender: 'female'
              }
            }
          },
          {
            user_id: 'member-3',
            User: {
              trust_score: 91,
              Profile: {
                name: 'Amit Patel',
                avatar_url: null,
                gender: 'male'
              }
            }
          }
        ]

        setActivity(mockDetail)
        setConfirmedMembers(mockMembers)
      } catch (err) {
        console.error('Failed to load activity details:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDetails()
  }, [id])

  const handleJoinClick = () => {
    // Open PreJoin safety gate checklist modal
    setCheckGateOpen(true)
  }

  const handleConfirmJoin = async () => {
    setCheckGateOpen(false)
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 800)) // Join API latency
      setUserJoinedStatus('pending')
      // Append user to members list for live preview updates
      setConfirmedMembers((prev) => [
        ...prev,
        {
          user_id: activeUser.id,
          User: {
            trust_score: activeUser.trust_score,
            Profile: {
              name: activeUser.name,
              avatar_url: null,
              gender: activeUser.gender
            }
          }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: activity.title,
        text: `Check out this trip: ${activity.title}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading && !activity) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 pb-24">
      {/* 1. Hero Cover Image */}
      <div className="relative h-60 sm:h-72 w-full rounded-2xl overflow-hidden bg-stone-100 border border-border">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80"
          alt={activity.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Large Vibe badge overlay */}
        <div className="absolute top-4 left-4 bg-stone-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-extrabold text-white tracking-wider shadow-lg">
          {activity.vibe_score_tag}
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 self-start px-2 py-0.5 rounded">
            {activity.type.toUpperCase()}
          </span>
          <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight">
            {activity.title}
          </h2>
        </div>
      </div>

      {/* 2. Primary Specs block */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface border border-border p-4 rounded-2xl shadow-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-text-secondary uppercase">Date</span>
          <span className="text-xs font-bold text-text-primary">Sat, 15 Jun at 6:00 AM</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-text-secondary uppercase">Destination</span>
          <span className="text-xs font-bold text-text-primary">{activity.destination}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-text-secondary uppercase">Cost Per Head</span>
          <span className="text-xs font-bold text-emerald-600">₹{activity.cost_per_person}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-text-secondary uppercase">Difficulty</span>
          <span className="text-xs font-bold text-text-primary capitalize">{activity.difficulty_level}</span>
        </div>
      </div>

      {/* 3. Description Section */}
      <div className="glass-card p-5 flex flex-col gap-3">
        <h3 className="text-sm font-bold text-text-primary">Trip Description</h3>
        <p className={`text-xs text-text-secondary leading-relaxed ${!descExpanded && 'line-clamp-3'}`}>
          {activity.description}
        </p>
        <button
          onClick={() => setDescExpanded(!descExpanded)}
          className="text-xs font-bold text-primary hover:underline mt-1 self-start"
        >
          {descExpanded ? 'Show less ▴' : 'Read more ▾'}
        </button>
      </div>

      {/* 4. Packing checklist accordion */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setPackingOpen(!packingOpen)}
          className="w-full p-4 flex items-center justify-between font-bold text-sm text-text-primary bg-stone-50/50 hover:bg-stone-50 border-b border-border/60"
        >
          <span>🎒 Packing Checklist</span>
          <span>{packingOpen ? '▴' : '▾'}</span>
        </button>
        {packingOpen && (
          <div className="p-4 flex flex-col gap-2">
            {activity.packing_checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-text-secondary">
                <input type="checkbox" disabled className="accent-primary" />
                <span>{item.item} ({item.qty})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Group Trust Snapshot */}
      <GroupTrustSnapshot members={confirmedMembers} />

      {/* 6. Creator Host details card */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 border border-border/80">
        <Avatar
          src={activity.Creator?.Profile?.avatar_url}
          name={activity.Creator?.Profile?.name || 'Host'}
          size="lg"
          score={activity.Creator?.trust_score}
        />
        <div className="flex-1 flex flex-col gap-2 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <h4 className="text-sm font-bold text-text-primary">
              Host: {activity.Creator?.Profile?.name}
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full self-center sm:self-auto">
              Trusted Host ({activity.Creator?.trust_score})
            </span>
          </div>
          <p className="text-xs text-text-secondary italic">
            "{activity.Creator?.Profile?.bio}"
          </p>
          <div className="flex justify-center sm:justify-start gap-4 text-[10px] font-bold text-text-secondary mt-1">
            <span>🛡️ Reliability: {activity.Creator?.reliability_score}%</span>
            <span>🎒 Trips Hosted: 15</span>
          </div>
        </div>
      </div>

      {/* 7. Sticky bottom action bar (mobile adaptive) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-border z-40 px-4 py-2.5 flex items-center justify-between shadow-2xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-secondary uppercase">Availability</span>
          <span className="text-xs font-extrabold text-primary">
            {activity.max_group_size - activity.current_members} of {activity.max_group_size} spots left
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Share */}
          <button
            onClick={handleShare}
            className="w-10 h-10 border border-border rounded-xl flex items-center justify-center hover:bg-stone-50"
            title="Share activity"
          >
            📤
          </button>

          {/* Join CTA triggers */}
          {userJoinedStatus === 'none' && (
            <button
              onClick={handleJoinClick}
              className="h-10 px-6 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary-dark transition-colors"
            >
              Request to Join
            </button>
          )}

          {userJoinedStatus === 'pending' && (
            <button
              disabled
              className="h-10 px-6 bg-stone-100 text-stone-400 border border-border text-xs font-bold rounded-xl cursor-not-allowed"
            >
              Request Pending 🕒
            </button>
          )}

          {userJoinedStatus === 'confirmed' && (
            <Link
              to={`/trip-rooms/${activity.id}`}
              className="h-10 px-6 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-emerald-700 flex items-center justify-center"
            >
              View Trip Room 💬
            </Link>
          )}
        </div>
      </div>

      {/* Safety check gate popup */}
      <PreJoinCheckGate
        isOpen={checkGateOpen}
        onClose={() => setCheckGateOpen(false)}
        user={activeUser}
        activity={activity}
        onConfirm={handleConfirmJoin}
      />
    </div>
  )
}

export default ActivityDetailPage
export { ActivityDetailPage }
