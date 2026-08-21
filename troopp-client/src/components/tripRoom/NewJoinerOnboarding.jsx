import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from '../../utils/haptics.js'

/**
 * 4-Screen gating sequence for new joiners in trip rooms.
 * Completely redesigned to conform to premium dark moody adventure theme.
 */
const NewJoinerOnboarding = ({
  onComplete,
  tripName = 'Trip',
  hostName = 'Host',
  hostAvatar = null,
  safetyText = '',
  rules: rulesProp = null,
  messagesCount = 0,
  expensesSum = 0,
  pollsCount = 0,
  members = []
}) => {
  const [screen, setScreen] = useState(1)
  const [briefingChecked, setBriefingChecked] = useState(false)
  const [isNextHovered, setIsNextHovered] = useState(false)
  const [isBackHovered, setIsBackHovered] = useState(false)

  const handleNext = () => {
    haptics.lightTap()
    if (screen < 4) {
      setScreen(screen + 1)
    } else {
      haptics.success()
      onComplete()
    }
  }

  const handleBack = () => {
    haptics.lightTap()
    if (screen > 1) {
      setScreen(screen - 1)
    }
  }

  // Pre-configured 8 core safety rules (fallbacks, populated dynamically from rulesProp if exists)
  const rules = []
  rules.push({ rule: 'Respect personal boundaries and travel decisions', type: 'Required', color: '#ff5470' })
  rules.push({ rule: 'Show up on time at the designated meeting point coordinates', type: 'Required', color: '#ff5470' })
  if (rulesProp) {
    rules.push({ rule: 'Share trip expenses on the group ledger', type: rulesProp.members_can_add_expenses ? 'Allowed' : 'Host Only', color: rulesProp.members_can_add_expenses ? '#3b82f6' : '#ffc94d' })
    rules.push({ rule: 'Create coordinate polls for voting', type: rulesProp.members_can_create_polls ? 'Allowed' : 'Host Only', color: rulesProp.members_can_create_polls ? '#3b82f6' : '#ffc94d' })
    rules.push({ rule: 'Group chat participant permissions', type: rulesProp.chat_before_full ? 'Open' : 'Muted', color: rulesProp.chat_before_full ? '#4fbe8e' : '#ff5470' })
    if (rulesProp.checkin_required) {
      rules.push({ rule: 'Coordinate waypoints check-ins with host commands', type: 'Required', color: '#ff5470' })
    }
  } else {
    rules.push({ rule: 'Share trip expenses transparently on the group ledger', type: 'Flexible', color: '#3b82f6' })
    rules.push({ rule: 'Mute chat notifications after 11 PM to prevent spam', type: 'Recommended', color: '#4fbe8e' })
    rules.push({ rule: 'Coordinate waypoints check-ins with host commands', type: 'Required', color: '#ff5470' })
  }
  rules.push({ rule: 'Maintain community safety guidelines', type: 'Required', color: '#ff5470' })
  rules.push({ rule: 'Zero tolerance for any safety or harassment violations', type: 'Enforced', color: '#ff6a2c' })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(16, 21, 26, 0.95)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#1a2129',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          minHeight: '480px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          userSelect: 'none'
        }}
      >
        
        {/* Step Indicator Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', marginBottom: '16px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#6b757c', letterSpacing: '0.08em' }}>
            Onboarding Checkpoints
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: '700',
              padding: '2px 8px',
              background: '#212b33',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '4px',
              color: '#9ba6ad'
            }}
          >
            Screen {screen} of 4
          </span>
        </div>

        <AnimatePresence mode="wait">
          {screen === 1 && (
            <motion.div
              key="screen1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: '#212b33', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}>
                  {hostAvatar ? (
                    <img src={hostAvatar} alt={hostName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#ff6a2c' }}>
                      {hostName[0]}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Welcome from {hostName}</span>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f3f1ea', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tripName}</h3>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Safety Briefing Briefs</span>
                <div
                  style={{
                    height: '140px',
                    overflowY: 'auto',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: '#212b33',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '12px',
                    color: '#f3f1ea',
                    lineHeight: '1.5',
                    textAlign: 'left'
                  }}
                  className="scrollbar-thin"
                >
                  {safetyText || 'Please read before entering: Make sure to carry adequate hydration supplies, trekking shoes, and light clothing. Cooperate with the host guidelines at check-ins. Be respectful of local customs. Stay safe!'}
                </div>
              </div>

              {/* Styled checkbox block */}
              <div
                onClick={() => setBriefingChecked(!briefingChecked)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginTop: '4px',
                  cursor: 'pointer',
                  padding: '10px',
                  borderRadius: '10px',
                  background: briefingChecked ? 'rgba(255,106,44,0.06)' : 'transparent',
                  border: '1px solid',
                  borderColor: briefingChecked ? 'rgba(255,106,44,0.15)' : 'transparent',
                  transition: 'all 150ms ease'
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    border: '2px solid',
                    borderColor: briefingChecked ? '#ff6a2c' : '#6b757c',
                    background: briefingChecked ? '#ff6a2c' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                    transition: 'all 150ms ease'
                  }}
                >
                  {briefingChecked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#1a0e08" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: '#9ba6ad', lineHeight: '1.4' }}>
                  I have read, understood, and agree to abide by this trip's safety briefing guidelines.
                </span>
              </div>
            </motion.div>
          )}

          {screen === 2 && (
            <motion.div
              key="screen2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f3f1ea', margin: 0 }}>Establish Group Guidelines</h3>
                <span style={{ fontSize: '12px', color: '#9ba6ad' }}>
                  Please review the active rules configured for this trip room.
                </span>
              </div>

              <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 90px',
                    background: '#212b33',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    padding: '8px 12px',
                    fontSize: '9px',
                    fontWeight: '700',
                    color: '#6b757c',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}
                >
                  <span>Guideline Rule</span>
                  <span style={{ textAlign: 'right' }}>Policy</span>
                </div>
                <div style={{ maxHeight: '180px', overflowY: 'auto', divideY: '1px solid rgba(255,255,255,0.04)' }} className="scrollbar-thin">
                  {(Array.isArray(rules) ? rules : []).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 90px',
                        padding: '10px 12px',
                        fontSize: '11px',
                        borderBottom: idx < rules.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        lineHeight: '1.4'
                      }}
                    >
                      <span style={{ color: '#f3f1ea' }}>{item?.rule}</span>
                      <span style={{ textAlign: 'right', fontWeight: '700', color: item?.color }}>{item?.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {screen === 3 && (
            <motion.div
              key="screen3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f3f1ea', margin: 0 }}>Group Activity Snapshot</h3>
                <p style={{ fontSize: '12px', color: '#9ba6ad', margin: 0 }}>
                  Here is what has happened in the room while you were away.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ padding: '12px 8px', background: '#212b33', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '18px', fontWeight: '700', color: '#f3f1ea' }}>{messagesCount}</span>
                  <span style={{ fontSize: '9px', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '2px', display: 'block' }}>Messages</span>
                </div>
                <div style={{ padding: '12px 8px', background: '#212b33', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '18px', fontWeight: '700', color: '#f3f1ea' }}>
                    {expensesSum < 1000 ? `₹${expensesSum}` : `₹${(expensesSum / 1000).toFixed(1)}k`}
                  </span>
                  <span style={{ fontSize: '9px', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '2px', display: 'block' }}>Expenses</span>
                </div>
                <div style={{ padding: '12px 8px', background: '#212b33', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '18px', fontWeight: '700', color: '#f3f1ea' }}>{pollsCount}</span>
                  <span style={{ fontSize: '9px', color: '#9ba6ad', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '2px', display: 'block' }}>Active Polls</span>
                </div>
              </div>

              <div style={{ padding: '12px 14px', background: '#212b33', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#6b757c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirmed Travelers</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {(Array.isArray(members) ? members : []).slice(0, 3).map((m, i) => (
                    <div key={m?.userId || m?.id || i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ff6a2c', fontSize: '9px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #1a2129', color: '#1a0e08', overflow: 'hidden' }}>
                      {m?.avatarUrl || m?.User?.Profile?.avatar_url ? (
                        <img src={m?.avatarUrl || m?.User?.Profile?.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        ((m?.name || m?.User?.Profile?.name || 'U')[0] || 'U').toUpperCase()
                      )}
                    </div>
                  ))}
                  {(Array.isArray(members) ? members : []).length > 3 && (
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', marginLeft: '4px' }}>
                      + {(Array.isArray(members) ? members : []).length - 3} others
                    </span>
                  )}
                  {(Array.isArray(members) ? members : []).length === 0 && (
                    <span style={{ fontSize: '11px', color: '#6b757c', fontStyle: 'italic' }}>
                      Host is only member
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {screen === 4 && (
            <motion.div
              key="screen4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', textAlign: 'center' }}
            >
              <span style={{ fontSize: '44px' }} className="animate-bounce">🎒</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f3f1ea', margin: 0 }}>Ready to Join!</h3>
                <p style={{ fontSize: '12px', color: '#9ba6ad', maxWidth: '300px', lineHeight: '1.5', margin: 0 }}>
                  Onboarding complete. You can now chat, view waypoints, split expenses, and coordinate checklists.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stepper Buttons Container */}
        <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '20px' }}>
          {screen > 1 && screen < 4 && (
            <button
              onClick={handleBack}
              onMouseEnter={() => setIsBackHovered(true)}
              onMouseLeave={() => setIsBackHovered(false)}
              style={{
                flex: 1,
                height: '44px',
                border: '1px solid rgba(255,255,255,0.14)',
                background: isBackHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: '#9ba6ad',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              Back
            </button>
          )}
          
          {screen === 1 ? (
            <button
              disabled={!briefingChecked}
              onClick={handleNext}
              onMouseEnter={() => setIsNextHovered(true)}
              onMouseLeave={() => setIsNextHovered(false)}
              style={{
                width: '100%',
                height: '44px',
                background: briefingChecked
                  ? 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)'
                  : '#212b33',
                color: briefingChecked ? '#1a0e08' : '#6b757c',
                border: briefingChecked ? 'none' : '1px solid rgba(255,255,255,0.04)',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: briefingChecked ? 'pointer' : 'not-allowed',
                boxShadow: briefingChecked && isNextHovered ? '0 6px 18px rgba(255,106,44,0.35)' : 'none',
                transition: 'all 150ms ease'
              }}
            >
              Agree & Continue
            </button>
          ) : screen < 4 ? (
            <button
              onClick={handleNext}
              onMouseEnter={() => setIsNextHovered(true)}
              onMouseLeave={() => setIsNextHovered(false)}
              style={{
                flex: 1,
                height: '44px',
                background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                color: '#1a0e08',
                border: 'none',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: isNextHovered ? '0 6px 18px rgba(255,106,44,0.35)' : 'none',
                transition: 'all 150ms ease'
              }}
            >
              I Understand
            </button>
          ) : (
            <button
              onClick={handleNext}
              onMouseEnter={() => setIsNextHovered(true)}
              onMouseLeave={() => setIsNextHovered(false)}
              style={{
                width: '100%',
                height: '44px',
                background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                color: '#1a0e08',
                border: 'none',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: isNextHovered ? '0 6px 18px rgba(255,106,44,0.35)' : 'none',
                transition: 'all 150ms ease'
              }}
            >
              Enter Chat Channel 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewJoinerOnboarding
export { NewJoinerOnboarding }
