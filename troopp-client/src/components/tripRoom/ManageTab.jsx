import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Avatar from '../common/Avatar.jsx'

/**
 * Host Management Dashboard. Handles mutes, kicks, locks, trip progress state toggling, and aggregates safety health statistics.
 */
const ManageTab = ({
  roomId,
  members = [],
  healthMetrics = {},
  onMuteMember,
  onRemoveMember,
  onToggleChat,
  onToggleLock,
  onMarkStarted,
  onMarkEnded,
  onCancelTrip,
  onLockExpenses,
  onMarkAllSettled
}) => {
  // Chat state parameters
  const [chatEnabled, setChatEnabled] = useState(true)
  const [groupLocked, setGroupLocked] = useState(false)
  const [expensesLocked, setExpensesLocked] = useState(false)

  // Modals state
  const [muteTargetUser, setMuteTargetUser] = useState(null)
  const [muteDuration, setMuteDuration] = useState('24') // hours
  const [kickTargetUser, setKickTargetUser] = useState(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const handleMuteSubmit = () => {
    if (!muteTargetUser) return
    const uid = muteTargetUser.userId || muteTargetUser.user_id || muteTargetUser.User?.id || muteTargetUser.id
    onMuteMember(uid, parseInt(muteDuration))
    setMuteTargetUser(null)
  }

  const handleKickSubmit = () => {
    if (!kickTargetUser) return
    const uid = kickTargetUser.userId || kickTargetUser.user_id || kickTargetUser.User?.id || kickTargetUser.id
    onRemoveMember(uid)
    setKickTargetUser(null)
  }

  const handleCancelSubmit = () => {
    if (!cancelReason.trim()) return
    onCancelTrip(cancelReason.trim())
    setCancelOpen(false)
  }

  const getDisplayName = (m) => m?.name || m?.User?.Profile?.name || 'Explorer'

  const {
    averageTrustScore = 80,
    trustedMembersCount = 3,
    pendingCheckins = 4,
    reportsFiledCount = 0
  } = healthMetrics || {}

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-[#f3f1ea] pb-16">
      
      {/* LEFT COLUMN: Health Metrics & Global Trip Controls */}
      <div className="lg:col-span-6 flex flex-col gap-5">
        
        {/* GROUP HEALTH DASHBOARD */}
        <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-3">
          <span className="text-xs font-bold text-[#9ba6ad] uppercase tracking-wider">
            Group Safety & Trust Metrics
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#1a2129] border border-white/5 rounded-xl flex flex-col justify-between text-center">
              <span className="text-[10px] font-bold text-[#9ba6ad] uppercase">Avg Trust</span>
              <span className="text-xl font-black text-[#4fbe8e] font-display mt-1">{averageTrustScore}</span>
              <span className="text-[9px] text-[#6b757c] mt-0.5">Verified Safety</span>
            </div>
            <div className="p-3.5 bg-[#1a2129] border border-white/5 rounded-xl flex flex-col justify-between text-center">
              <span className="text-[10px] font-bold text-[#9ba6ad] uppercase">Trusted</span>
              <span className="text-xl font-black text-[#f3f1ea] font-display mt-1">{trustedMembersCount} / {(Array.isArray(members) ? members : []).length}</span>
              <span className="text-[9px] text-[#6b757c] mt-0.5">Score &gt;= 75</span>
            </div>
            <div className="p-3.5 bg-[#1a2129] border border-white/5 rounded-xl flex flex-col justify-between text-center">
              <span className="text-[10px] font-bold text-[#9ba6ad] uppercase">Check-ins</span>
              <span className="text-xl font-black text-[#ffc94d] font-display mt-1">{pendingCheckins}</span>
              <span className="text-[9px] text-[#6b757c] mt-0.5">Pending</span>
            </div>
            <div className="p-3.5 bg-[#1a2129] border border-white/5 rounded-xl flex flex-col justify-between text-center">
              <span className="text-[10px] font-bold text-[#9ba6ad] uppercase">Reports</span>
              <span className="text-xl font-black text-[#ff5470] font-display mt-1">{reportsFiledCount}</span>
              <span className="text-[9px] text-[#6b757c] mt-0.5">Flags</span>
            </div>
          </div>
        </div>

        {/* CHAT CONTROLS */}
        <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1 max-w-[75%]">
            <span className="text-sm font-bold text-[#f3f1ea]">Participant Chat Active</span>
            <span className="text-xs text-[#9ba6ad] leading-relaxed">
              When toggled off, only host announcements are permitted inside the channel.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer w-11 h-6 flex-shrink-0">
            <input
              type="checkbox"
              checked={chatEnabled}
              onChange={(e) => {
                setChatEnabled(e.target.checked)
                onToggleChat(e.target.checked)
              }}
              className="sr-only"
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${chatEnabled ? 'bg-[#ff6a2c]' : 'bg-[#212b33] border border-white/10'}`} />
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${chatEnabled ? 'transform translate-x-5' : ''}`} />
          </label>
        </div>

        {/* TRIP STATE CONTROLS */}
        <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-3">
          <span className="text-xs font-bold text-[#9ba6ad] uppercase tracking-wider">
            Trip Lifecycle Controls
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={onMarkStarted}
              className="h-10 bg-[#212b33] hover:bg-[#2b3742] border border-white/10 text-xs font-bold rounded-xl text-[#f3f1ea] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🚀</span>
              <span>Mark Trip Started</span>
            </button>
            <button
              onClick={onMarkEnded}
              className="h-10 bg-[#212b33] hover:bg-[#2b3742] border border-white/10 text-xs font-bold rounded-xl text-[#f3f1ea] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🏁</span>
              <span>Mark Trip Ended</span>
            </button>
            <button
              onClick={() => setCancelOpen(true)}
              className="h-10 bg-[rgba(255,84,112,0.12)] hover:bg-[rgba(255,84,112,0.2)] border border-[rgba(255,84,112,0.3)] text-xs font-bold rounded-xl text-[#ff5470] transition-all cursor-pointer sm:col-span-2 flex items-center justify-center gap-1.5"
            >
              <span>⚠️</span>
              <span>Cancel Trip & Close Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: MEMBER ROSTER MANAGEMENT */}
      <div className="lg:col-span-6 flex flex-col gap-3">
        <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="text-xs font-bold text-[#9ba6ad] uppercase tracking-wider">
              Member Roster ({(Array.isArray(members) ? members : []).length})
            </span>
            <span className="text-[11px] text-[#9ba6ad]">Host moderation</span>
          </div>

          <div className="flex flex-col gap-2">
            {(Array.isArray(members) ? members : []).map((m) => {
              if (!m) return null
              const uid = m.userId || m.user_id || m.User?.id || m.id
              const mName = m.name || m.User?.Profile?.name || 'Explorer'
              const mAvatar = m.avatarUrl || m.User?.Profile?.avatar_url
              const mTrust = m.trustScore || m.User?.trust_score || 50
              const mReliability = m.reliabilityScore || m.User?.reliability_score || 100
              
              return (
                <div
                  key={uid}
                  className="p-3 bg-[#1a2129] border border-white/5 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={mAvatar} name={mName} size="sm" score={mTrust} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[#f3f1ea] truncate">{mName}</span>
                      <span className="text-[10px] text-[#9ba6ad]">
                        Trust: {mTrust} · Reliability: {mReliability}%
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setMuteTargetUser(m)}
                      className="h-7 px-2.5 bg-[#212b33] hover:bg-[#2b3742] border border-white/10 text-[#9ba6ad] hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      🔇 Mute
                    </button>
                    <button
                      onClick={() => setKickTargetUser(m)}
                      className="h-7 px-2.5 bg-[rgba(255,84,112,0.12)] hover:bg-[rgba(255,84,112,0.2)] text-[#ff5470] rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      🥾 Kick
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mute Modal overlay */}
      <AnimatePresence>
        {muteTargetUser && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-5 w-full max-w-xs shadow-2xl flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#9ba6ad]">
                Mute {getDisplayName(muteTargetUser)}
              </h4>
              <div className="flex flex-col gap-1.5 text-xs">
                <span className="font-bold text-[#9ba6ad]">Select Mute Expiry</span>
                <select
                  value={muteDuration}
                  onChange={(e) => setMuteDuration(e.target.value)}
                  className="w-full h-10 bg-[#1a2129] border border-white/10 rounded-xl px-3 text-xs text-[#f3f1ea] outline-none"
                >
                  <option value="1">Mute for 1 Hour</option>
                  <option value="24">Mute for 24 Hours</option>
                  <option value="72">Mute for 72 Hours (Trip expiry)</option>
                </select>
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setMuteTargetUser(null)}
                  className="flex-1 h-9 border border-white/10 bg-[#1a2129] rounded-xl text-[#9ba6ad] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMuteSubmit}
                  className="flex-1 h-9 bg-[rgba(255,84,112,0.14)] text-[#ff5470] rounded-xl text-xs font-bold cursor-pointer"
                >
                  Confirm Mute
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Kick Modal overlay */}
      <AnimatePresence>
        {kickTargetUser && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-5 w-full max-w-xs shadow-2xl flex flex-col gap-4 text-center">
              <span className="text-3xl">🥾</span>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-bold uppercase text-[#ff5470]">Remove Member?</h4>
                <p className="text-xs text-[#9ba6ad] mt-1">
                  Are you sure you want to remove {getDisplayName(kickTargetUser)} from this trip room?
                </p>
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setKickTargetUser(null)}
                  className="flex-1 h-9 border border-white/10 bg-[#1a2129] rounded-xl text-[#9ba6ad] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleKickSubmit}
                  className="flex-1 h-9 bg-[rgba(255,84,112,0.14)] text-[#ff5470] rounded-xl text-xs font-bold cursor-pointer"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Trip Modal overlay */}
      <AnimatePresence>
        {cancelOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4">
              <h4 className="text-xs font-bold uppercase text-[#ff5470]">Cancel Activity</h4>
              <div className="flex flex-col gap-1.5 text-xs">
                <span className="font-bold text-[#9ba6ad]">Provide Cancellation Reason</span>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Weather warning or road closure"
                  className="w-full bg-[#1a2129] border border-white/10 rounded-xl p-3 text-xs text-[#f3f1ea] resize-none outline-none focus:border-[#ff5470]"
                />
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setCancelOpen(false)}
                  className="flex-1 h-9 border border-white/10 bg-[#1a2129] rounded-xl text-[#9ba6ad] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={!cancelReason.trim()}
                  onClick={handleCancelSubmit}
                  className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all ${
                    cancelReason.trim()
                      ? 'bg-[rgba(255,84,112,0.14)] text-[#ff5470] cursor-pointer'
                      : 'bg-white/5 text-[#6b757c] cursor-not-allowed'
                  }`}
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ManageTab
export { ManageTab }
