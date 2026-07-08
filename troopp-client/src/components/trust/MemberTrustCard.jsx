import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Avatar from '../common/Avatar.jsx'
import ScoreBar from '../common/ScoreBar.jsx'
import TrustCircle from './TrustCircle.jsx'

/**
 * Novelty Trust Card Modal showing full behavioral reputation metrics.
 */
const MemberTrustCard = ({
  isOpen,
  onClose,
  userData,
  viewMode = 'member', // 'member' | 'host'
  onAccept,
  onDecline
}) => {
  if (!isOpen || !userData) return null

  const {
    name,
    avatar_url,
    trust_score = 50,
    reliability_score = 100,
    is_id_verified = false,
    is_face_verified = false,
    trips_completed = 5,
    positive_rating_pct = 95,
    tenure_months = 3,
    has_valid_reports = false,
    last_traveled_date = '12 May 2026',
    mutual_connections = ['Amit Patel', 'Priya Sharma']
  } = userData

  const [currentTrust, setCurrentTrust] = useState(trust_score)
  const [currentReliability, setCurrentReliability] = useState(reliability_score)

  useEffect(() => {
    setCurrentTrust(trust_score)
    setCurrentReliability(reliability_score)
  }, [userData, trust_score, reliability_score])

  return (
    <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-md z-50 flex items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full h-full sm:h-auto sm:max-w-md bg-surface border border-border sm:rounded-2xl p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
      >
        {/* Header close trigger */}
        <div className="flex justify-between items-center border-b border-border pb-3 mb-2.5">
          <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">
            Member behavioral Profile
          </span>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-border hover:bg-stone-50 flex items-center justify-center font-bold text-xs">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 py-2">
          {/* Avatar and Verification badges */}
          <div className="flex items-center gap-4">
            <Avatar src={avatar_url} name={name} size="lg" score={currentTrust} />
            <div className="flex flex-col">
              <h3 className="text-base font-extrabold text-text-primary flex items-center gap-1.5">
                {name}
                {is_id_verified && (
                  <span className="text-xs" title="Government ID Verified">
                    🪪
                  </span>
                )}
                {is_face_verified && (
                  <span className="text-xs" title="Facial Recognition Verified">
                    📷
                  </span>
                )}
              </h3>
              <span className="text-[10px] text-text-secondary mt-0.5">
                Troopp member since {tenure_months} months ago
              </span>
            </div>
          </div>

          {/* Scores Panel (Trust Conic Circle + Reliability bar) */}
          <div className="grid grid-cols-2 gap-4 items-center bg-stone-50/50 border border-border/60 p-3.5 rounded-xl">
            {/* Circular Conic-gradient Trust score */}
            <div className="flex flex-col items-center gap-1.5 border-r border-border/80">
              <TrustCircle score={currentTrust} />
              <span className="text-[10px] font-bold text-text-secondary uppercase mt-1">
                Trust Score
              </span>
            </div>

            {/* ScoreBar Reliability score */}
            <div className="flex flex-col gap-1.5 px-1">
              <span className="text-[10px] font-bold text-text-secondary uppercase">
                Reliability: {currentReliability}%
              </span>
              <ScoreBar score={currentReliability} />
              <span className="text-[9px] text-text-secondary leading-snug">
                Based on showing up to confirmed trips.
              </span>
            </div>
          </div>

          {/* Mock Test Toolbar */}
          <div className="flex justify-between items-center gap-2 bg-stone-100/50 p-2 rounded-xl border border-stone-200/50">
            <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider pl-1">Simulator:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentTrust((prev) => Math.min(100, prev + 25))}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-200 cursor-pointer select-none"
              >
                +25 Trust
              </button>
              <button
                type="button"
                onClick={() => setCurrentReliability((prev) => Math.max(0, prev - 15))}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black rounded-lg border border-rose-200 cursor-pointer select-none"
              >
                -15 Reliability
              </button>
            </div>
          </div>

          {/* Core Stats list */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
              Engagement stats
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-stone-50 border border-border/40 p-2.5 rounded-xl">
                <span className="block text-sm font-extrabold text-text-primary">{trips_completed}</span>
                <span className="text-[9px] text-text-secondary">Trips Done</span>
              </div>
              <div className="bg-stone-50 border border-border/40 p-2.5 rounded-xl">
                <span className="block text-sm font-extrabold text-text-primary">{positive_rating_pct}%</span>
                <span className="text-[9px] text-text-secondary">Positive Rate</span>
              </div>
              <div className="bg-stone-50 border border-border/40 p-2.5 rounded-xl">
                <span className="block text-xs font-bold text-emerald-700 mt-1 leading-tight">
                  {has_valid_reports ? '🚨 Flagged' : '✅ Clear'}
                </span>
                <span className="text-[9px] text-text-secondary mt-0.5 block">Report History</span>
              </div>
            </div>
          </div>

          {/* Mutual connections overlay */}
          {mutual_connections.length > 0 && (
            <div className="flex flex-col gap-1 text-[10px] text-text-secondary leading-normal border-t border-border/60 pt-3">
              <span className="font-bold text-text-primary uppercase tracking-wide">
                Mutual Connections
              </span>
              <span>
                You and {name} both follow {mutual_connections.join(' and ')}
              </span>
            </div>
          )}

          {last_traveled_date && (
            <span className="text-[9px] text-text-secondary">
              🕒 Last active on a trip: {last_traveled_date}
            </span>
          )}
        </div>

        {/* Action Panel */}
        <div className="border-t border-border pt-4 mt-4 flex gap-3">
          {viewMode === 'host' ? (
            <>
              <button
                onClick={onDecline}
                className="flex-1 h-11 border border-rose-200 text-rose-600 bg-rose-50/20 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
              >
                Decline Join
              </button>
              <button
                onClick={onAccept}
                className="flex-[2] h-11 bg-primary text-white hover:bg-primary-dark rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                Approve & Confirm
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full h-11 bg-stone-850 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Close Profile
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default MemberTrustCard
export { MemberTrustCard }
