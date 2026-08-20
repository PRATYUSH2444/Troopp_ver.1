import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Avatar from '../common/Avatar.jsx'

/**
 * Signature Trust snapshot dashboard display confirmed users.
 */
const GroupTrustSnapshot = ({ members = [] }) => {
  const [modalOpen, setModalOpen] = useState(false)

  if (members.length === 0) {
    return (
      <div className="glass-card p-5 text-center text-xs text-text-secondary border border-dashed border-border flex flex-col items-center gap-1">
        <span>Be the first to join this trip! 🎒</span>
      </div>
    )
  }

  // Calculate Aggregates
  const totalCount = members.length
  const femaleCount = members.filter((m) => m.User?.Profile?.gender === 'female').length
  const maleCount = members.filter((m) => m.User?.Profile?.gender === 'male').length
  
  const avgTrustScore = Math.round(
    members.reduce((acc, m) => acc + (m.User?.trust_score || 50), 0) / totalCount
  )

  const getAvgBadge = (score) => {
    if (score >= 75) return { label: 'Trusted', bg: 'bg-emerald-100 text-emerald-800' }
    if (score >= 50) return { label: 'Explorer', bg: 'bg-blue-100 text-blue-800' }
    return { label: 'New', bg: 'bg-stone-100 text-stone-700' }
  }

  const avgBadge = getAvgBadge(avgTrustScore)
  const previewMembers = members.slice(0, 6)

  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08
      }
    }
  }

  const childVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 15 } }
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-4 shadow-sm border border-border">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-text-primary">
          Who's going on this trip
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${avgBadge.bg}`}>
          Group: {avgBadge.label} ({avgTrustScore})
        </span>
      </div>

      {/* Members Grid layout */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 gap-3.5"
      >
        {previewMembers.map((m) => {
          const profile = m.User?.Profile
          const trust = m.User?.trust_score || 50
          return (
            <motion.div
              key={m.id || m.user_id}
              variants={childVariants}
              className="flex items-center gap-2.5 p-2 bg-stone-50/50 hover:bg-stone-50 border border-border/40 rounded-xl"
            >
              <Avatar
                src={profile?.avatar_url}
                name={profile?.name || 'Explorer'}
                size="sm"
                score={trust}
              />
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-text-primary truncate">
                  {profile?.name || 'Explorer'}
                </span>
                <span className="text-[10px] text-text-secondary">
                  {profile?.gender === 'female' ? '👩 Female' : profile?.gender === 'male' ? '👨 Male' : '👤 Other'}
                </span>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Summary metrics bar */}
      <div className="border-t border-border/60 pt-3 flex justify-between items-center text-[10px] font-semibold text-text-secondary">
        <span>
          {femaleCount} Women · {maleCount} Men · {totalCount} Total
        </span>
        {members.length > 6 && (
          <button
            onClick={() => setModalOpen(true)}
            className="text-primary font-bold hover:underline"
          >
            View all profiles ({members.length}) →
          </button>
        )}
      </div>

      {/* All Members List modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-5 shadow-2xl flex flex-col gap-4 max-h-[80vh]">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text-primary">Trip Attendees</h3>
              <button onClick={() => setModalOpen(false)} className="text-xs font-bold">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              {members.map((m) => {
                const profile = m.User?.Profile
                const trust = m.User?.trust_score || 50
                return (
                  <div
                    key={m.id || m.user_id}
                    className="flex items-center justify-between p-3.5 bg-stone-50/50 rounded-xl border border-border/40"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        src={profile?.avatar_url}
                        name={profile?.name || 'Explorer'}
                        size="md"
                        score={trust}
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-text-primary">
                          {profile?.name || 'Explorer'}
                        </span>
                        <span className="text-[10px] text-text-secondary">
                          {profile?.gender === 'female' ? '👩 Female' : '👨 Male'} · Trust: {trust}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupTrustSnapshot
export { GroupTrustSnapshot }
