import React, { useState, useEffect } from 'react'
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

  // Safely resolve display name from potentially nested member objects
  const getDisplayName = (m) => m?.name || m?.User?.Profile?.name || 'Explorer'

  // Fallback defaults for health metrics
  const {
    averageTrustScore = 80,
    trustedMembersCount = 3,
    newMembersCount = 1,
    pendingCheckins = 4,
    reportsFiledCount = 0,
    womenPercentage = 30,
    emergencyContactsSetCount = 3
  } = healthMetrics

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#f3f1ea', paddingBottom: '64px' }}>
      
      {/* SECTION E: GROUP HEALTH DASHBOARD */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Group Health Metrics
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div style={{ padding: '14px', background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase' }}>Average Trust</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#4fbe8e', marginTop: '4px', fontFamily: 'var(--font-display)' }}>{averageTrustScore}</span>
            <span style={{ fontSize: '8px', color: '#6b757c' }}>Safety Checked</span>
          </div>
          <div style={{ padding: '14px', background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase' }}>Trusted Members</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#f3f1ea', marginTop: '4px', fontFamily: 'var(--font-display)' }}>{trustedMembersCount} / {members.length}</span>
            <span style={{ fontSize: '8px', color: '#6b757c' }}>Score &gt;= 75</span>
          </div>
          <div style={{ padding: '14px', background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase' }}>Pending Checkins</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#ffc94d', marginTop: '4px', fontFamily: 'var(--font-display)' }}>{pendingCheckins}</span>
            <span style={{ fontSize: '8px', color: '#6b757c' }}>Waypoints</span>
          </div>
          <div style={{ padding: '14px', background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center' }}>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase' }}>Safety Reports</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#ff5470', marginTop: '4px', fontFamily: 'var(--font-display)' }}>{reportsFiledCount}</span>
            <span style={{ fontSize: '8px', color: '#6b757c' }}>Active Flags</span>
          </div>
        </div>
      </div>

      {/* SECTION A: MEMBER MANAGEMENT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Member Roster ({members.length})
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {members.map((m) => {
            const uid = m.userId || m.user_id || m.User?.id || m.id
            const mName = m.name || m.User?.Profile?.name || 'Explorer'
            const mAvatar = m.avatarUrl || m.User?.Profile?.avatar_url
            const mTrust = m.trustScore || m.User?.trust_score || 50
            const mReliability = m.reliabilityScore || m.User?.reliability_score || 100
            
            return (
              <div key={uid} style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <Avatar src={mAvatar} name={mName} size="sm" score={mTrust} />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#f3f1ea', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mName}</span>
                    <span style={{ fontSize: '11px', color: '#9ba6ad', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Trust: {mTrust} · Reliability: {mReliability}%
                    </span>
                  </div>
                </div>

                {/* Action row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => setMuteTargetUser(m)}
                    style={{
                      height: '28px',
                      padding: '0 10px',
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: '#212b33',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#9ba6ad',
                      cursor: 'pointer'
                    }}
                    title="Mute traveler"
                  >
                    🔇 Mute
                  </button>
                  <button
                    onClick={() => setKickTargetUser(m)}
                    style={{
                      height: '28px',
                      padding: '0 10px',
                      border: 'none',
                      background: 'rgba(255,84,112,0.14)',
                      color: '#ff5470',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                    title="Remove traveler"
                  >
                    🥾 Kick
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION B: CHAT CONTROLS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Chat Configuration
        </span>
        <div style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '75%' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#f3f1ea' }}>Enable Participant Chat</span>
            <span style={{ fontSize: '11px', color: '#9ba6ad', lineHeight: 1.4 }}>
              When toggled off, only host announcements are permitted inside the channel.
            </span>
          </div>
          <label style={{ position: 'relative', inlineFlex: 'true', alignItems: 'center', cursor: 'pointer', width: '44px', height: '24px' }}>
            <input
              type="checkbox"
              checked={chatEnabled}
              onChange={(e) => {
                setChatEnabled(e.target.checked)
                onToggleChat(e.target.checked)
              }}
              style={{ display: 'none' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '100px',
                background: chatEnabled ? '#ff6a2c' : '#212b33',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'background-color 200ms ease'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '3px',
                left: chatEnabled ? 'calc(100% - 21px)' : '3px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                transition: 'left 200ms ease'
              }}
            />
          </label>
        </div>
      </div>

      {/* SECTION C: TRIP STATUS CONTROLS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Trip Status Actions
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={() => {
              setGroupLocked(!groupLocked)
              onToggleLock(!groupLocked)
            }}
            style={{
              height: '44px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              border: groupLocked ? '1px solid #ff5470' : '1px solid rgba(255,255,255,0.14)',
              background: groupLocked ? 'rgba(255,84,112,0.14)' : '#212b33',
              color: groupLocked ? '#ff5470' : '#f3f1ea',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            {groupLocked ? '🔓 Open Group Entry' : '🔒 Lock Group Entries'}
          </button>
          <button
            onClick={onMarkStarted}
            style={{
              height: '44px',
              background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
              color: '#1a0e08',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255,106,44,0.2)'
            }}
          >
            🏁 Mark Trip Started
          </button>
          <button
            onClick={onMarkEnded}
            style={{
              height: '44px',
              background: 'rgba(79,190,142,0.14)',
              color: '#4fbe8e',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🏁 Mark Trip Completed
          </button>
          <button
            onClick={() => setCancelOpen(true)}
            style={{
              height: '44px',
              background: 'rgba(255,84,112,0.14)',
              color: '#ff5470',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            🚫 Cancel This Trip
          </button>
        </div>
      </div>

      {/* SECTION D: EXPENSE LEDGER CONTROLS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Ledger Management
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button
            onClick={() => {
              setExpensesLocked(!expensesLocked)
              onLockExpenses(!expensesLocked)
            }}
            style={{
              height: '44px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              border: expensesLocked ? '1px solid #ff5470' : '1px solid rgba(255,255,255,0.14)',
              background: expensesLocked ? 'rgba(255,84,112,0.14)' : '#212b33',
              color: expensesLocked ? '#ff5470' : '#f3f1ea',
              cursor: 'pointer',
              transition: 'all 150ms ease'
            }}
          >
            {expensesLocked ? '🔓 Unlock Ledger' : '🔒 Lock Ledger'}
          </button>
          <button
            onClick={onMarkAllSettled}
            style={{
              height: '44px',
              background: '#212b33',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f3f1ea',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            💸 Mark All Settled
          </button>
        </div>
      </div>

      {/* Mute Modal overlay */}
      <AnimatePresence>
        {muteTargetUser && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,16,19,0.75)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '320px', boxShadow: '0 12px 36px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ba6ad' }}>
                Mute {getDisplayName(muteTargetUser)}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <span style={{ fontWeight: '700', color: '#9ba6ad' }}>Select Mute Expiry</span>
                <select
                  value={muteDuration}
                  onChange={(e) => setMuteDuration(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '100px',
                    padding: '0 16px',
                    color: '#f3f1ea',
                    outline: 'none',
                    fontSize: '12px'
                  }}
                >
                  <option value="1">Mute for 1 Hour</option>
                  <option value="24">Mute for 24 Hours</option>
                  <option value="72">Mute for 72 Hours (Trip expiry)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => setMuteTargetUser(null)} style={{ flex: 1, height: '36px', border: '1px solid rgba(255,255,255,0.08)', background: '#212b33', borderRadius: '100px', color: '#9ba6ad', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleMuteSubmit} style={{ flex: 1, height: '36px', border: 'none', background: 'rgba(255,84,112,0.14)', color: '#ff5470', borderRadius: '100px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
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
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,16,19,0.75)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '320px', boxShadow: '0 12px 36px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '32px' }}>🥾</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#ff5470' }}>Remove Member?</h4>
                <p style={{ fontSize: '12px', color: '#9ba6ad', marginTop: '6px' }}>
                  Are you sure you want to kick {getDisplayName(kickTargetUser)} from this trip room? This will promote the next waitlisted traveler.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => setKickTargetUser(null)} style={{ flex: 1, height: '36px', border: '1px solid rgba(255,255,255,0.08)', background: '#212b33', borderRadius: '100px', color: '#9ba6ad', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleKickSubmit} style={{ flex: 1, height: '36px', border: 'none', background: 'rgba(255,84,112,0.14)', color: '#ff5470', borderRadius: '100px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Modal overlay */}
      <AnimatePresence>
        {cancelOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,16,19,0.75)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '320px', boxShadow: '0 12px 36px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#ff5470' }}>Cancel Activity</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <span style={{ fontWeight: '700', color: '#9ba6ad' }}>Provide Cancellation Reason</span>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Incessant monsoon rain warnings"
                  style={{
                    width: '100%',
                    background: '#212b33',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    fontSize: '12px',
                    color: '#f3f1ea',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => setCancelOpen(false)} style={{ flex: 1, height: '36px', border: '1px solid rgba(255,255,255,0.08)', background: '#212b33', borderRadius: '100px', color: '#9ba6ad', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  disabled={!cancelReason.trim()}
                  onClick={handleCancelSubmit}
                  style={{
                    flex: 1,
                    height: '36px',
                    border: 'none',
                    borderRadius: '100px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: cancelReason.trim() ? 'rgba(255,84,112,0.14)' : '#212b33',
                    color: cancelReason.trim() ? '#ff5470' : '#6b757c',
                    cursor: cancelReason.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 150ms ease'
                  }}
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
