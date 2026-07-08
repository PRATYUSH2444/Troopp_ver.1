import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import Avatar from './Avatar.jsx'
import Card from './Card.jsx'
import ScoreBar from './ScoreBar.jsx'

/**
 * @typedef {Object} MemberType
 * @property {string} id
 * @property {string} name
 * @property {string} [avatar_url]
 * @property {'male' | 'female' | 'other' | 'prefer_not_to_say'} gender
 * @property {number} trust_score
 * @property {number} trips_completed_count
 */

/**
 * @typedef {Object} GroupTrustSnapshotProps
 * @property {MemberType[]} members - List of active confirmed members in trip
 * @property {() => void} [onViewAll] - Callback to view detail modal
 * @property {string} [className] - Class overrides
 */

/**
 * Troopp Signature Novelty Component: Group Trust Snapshot.
 * Displays real-world trust profiles of members before join commitment.
 * @param {GroupTrustSnapshotProps} props
 */
const GroupTrustSnapshot = ({ members = [], onViewAll, className }) => {
  if (!members || members.length === 0) {
    return null
  }

  // 1. Calculate Aggregate Metrics
  const totalCount = members.length
  const averageTrust = Math.round(
    members.reduce((acc, m) => acc + (m.trust_score || 50), 0) / totalCount
  )

  const femaleCount = members.filter((m) => m.gender === 'female').length
  const maleCount = members.filter((m) => m.gender === 'male').length
  const femaleRatio = totalCount > 0 ? Math.round((femaleCount / totalCount) * 100) : 0
  const maleRatio = totalCount > 0 ? Math.round((maleCount / totalCount) * 100) : 0

  // 2. Gender Icon Resolvers
  const getGenderIcon = (gender) => {
    switch (gender) {
      case 'male':
        return <span className="text-blue-500 font-bold text-xs" title="Male">♂</span>
      case 'female':
        return <span className="text-pink-500 font-bold text-xs" title="Female">♀</span>
      default:
        return <span className="text-stone-400 font-bold text-xs" title="Other">⚦</span>
    }
  }

  // 3. Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08, // Stagger delays
      },
    },
  }

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  }

  return (
    <Card className={clsx('glass-card border border-border flex flex-col gap-4', className)}>
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h4 className="text-sm font-heading font-bold text-text-primary uppercase tracking-wider">
          Who's going on this trip
        </h4>
        <span className="text-xs font-bold text-primary bg-primary-light/40 px-2 py-0.5 rounded-full">
          {totalCount} Confirmed
        </span>
      </div>

      {/* Member Grid List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4"
      >
        {members.slice(0, 5).map((member) => (
          <motion.div
            key={member.id}
            variants={itemVariants}
            className="flex flex-col items-center text-center gap-1.5 focus:outline-none"
          >
            {/* Avatar & Trust Badge overlay */}
            <Avatar
              src={member.avatar_url}
              name={member.name}
              size="lg"
              showBadge={true}
              score={member.trust_score}
            />

            {/* Name, Gender, Trips count */}
            <div className="flex items-center gap-1 mt-1.5 max-w-full">
              <span className="text-xs font-semibold text-text-primary truncate max-w-[50px] sm:max-w-[70px]">
                {member.name.split(' ')[0]}
              </span>
              {getGenderIcon(member.gender)}
            </div>

            <span className="text-[10px] text-text-secondary leading-none">
              {member.trips_completed_count || 0} completed
            </span>
          </motion.div>
        ))}

        {/* Overflow placeholder if more than 5 members */}
        {totalCount > 5 && (
          <motion.button
            onClick={onViewAll}
            variants={itemVariants}
            className="flex flex-col items-center justify-center gap-1.5 w-14 h-24 rounded-xl hover:bg-border/10 focus:outline-none"
          >
            <div className="w-14 h-14 rounded-full bg-border/40 border border-border flex items-center justify-center text-sm font-bold text-text-secondary shadow-sm">
              +{totalCount - 5}
            </div>
            <span className="text-[10px] text-primary font-bold">View All</span>
          </motion.button>
        )}
      </motion.div>

      {/* Summary Aggregate Bar */}
      <motion.div
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: Math.min(totalCount, 5) * 0.08 + 0.15,
          type: 'spring',
          stiffness: 150,
          damping: 18
        }}
        className="flex flex-col gap-3 mt-1.5 border-t border-border pt-4"
      >
        {/* Gender ratio bar visual */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-text-secondary">
            <span>Gender Distribution</span>
            <span>{femaleRatio}% Female / {maleRatio}% Male</span>
          </div>
          <div className="w-full h-2 bg-border/40 rounded-full flex overflow-hidden shadow-inner">
            <div style={{ width: `${femaleRatio}%` }} className="bg-pink-400 h-full transition-all" />
            <div style={{ width: `${maleRatio}%` }} className="bg-blue-400 h-full transition-all" />
            {totalCount === 0 && <div className="w-full bg-stone-300 h-full" />}
          </div>
        </div>

        {/* Aggregate Trust Score bar */}
        <ScoreBar score={averageTrust} label="Group Average Trust Score" showTextVal={true} />
      </motion.div>

      {/* View Full details trigger button */}
      {onViewAll && (
        <Button variant="secondary" size="sm" onClick={onViewAll} fullWidth={true} className="mt-1">
          View Confirmed Profiles
        </Button>
      )}
    </Card>
  )
}

export default GroupTrustSnapshot
export { GroupTrustSnapshot }
