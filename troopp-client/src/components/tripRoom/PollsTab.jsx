import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { haptics } from '../../utils/haptics.js'

// Percentage Number Ticker component (400ms count-up/down)
const NumberTicker = ({ value, duration = 400 }) => {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)
  
  useEffect(() => {
    let start = prevValueRef.current
    const end = value
    if (start === end) return
    
    const startTime = performance.now()
    let frameId
    
    const update = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = progress * (2 - progress) // Ease out quad
      const current = Math.round(start + (end - start) * easeProgress)
      setDisplayValue(current)
      
      if (progress < 1) {
        frameId = requestAnimationFrame(update)
      } else {
        setDisplayValue(end)
        prevValueRef.current = end
      }
    }
    
    frameId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frameId)
  }, [value, duration])

  useEffect(() => {
    prevValueRef.current = value
  }, [value])
  
  return <span>{displayValue}%</span>
}


/**
 * Shared voting polls dashboard for trip logistics.
 */
const PollsTab = ({
  polls = [],
  currentUserId,
  isHost = false,
  onCreatePoll,
  onVotePoll,
  onClosePoll
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  const handleOpenModal = () => {
    setQuestion('')
    setOptions(['', ''])
    setModalOpen(true)
  }

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, ''])
    }
  }

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleOptionChange = (index, value) => {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
  }

  const handleSubmit = () => {
    const filledOptions = options.map((o) => o.trim()).filter(Boolean)
    if (!question.trim() || filledOptions.length < 2) return

    onCreatePoll({
      question: question.trim(),
      options: filledOptions
    })
    setModalOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#f3f1ea', position: 'relative', minHeight: '460px' }}>
      
      {/* Top Description */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f3f1ea', fontFamily: 'var(--font-display)' }}>Trip Room Polls</h3>
        <span style={{ fontSize: '11px', color: '#9ba6ad', marginTop: '2px' }}>
          Decide on logistics, departure times, and routes together.
        </span>
      </div>

      {/* Polls list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '64px' }}>
        {(!Array.isArray(polls) || polls.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#1a2129', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '32px' }}>📊</span>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#f3f1ea' }}>No active polls</h4>
            <p style={{ fontSize: '11px', color: '#9ba6ad' }}>Tap the orange button to coordinate a new vote.</p>
          </div>
        ) : (
          polls.map((poll) => {
            if (!poll) return null

            const rawOptions = poll.options
            const pollOptions = Array.isArray(rawOptions)
              ? rawOptions
              : typeof rawOptions === 'string'
              ? (() => { try { return JSON.parse(rawOptions) } catch { return [] } })()
              : []

            const rawVotes = poll.votes
            const votes = Array.isArray(rawVotes)
              ? rawVotes
              : typeof rawVotes === 'string'
              ? (() => { try { return JSON.parse(rawVotes) } catch { return [] } })()
              : []

            // Count total votes
            let totalVotes = 0
            let maxVotesIndex = -1
            let maxVotesCount = 0

            votes.forEach((vArr, idx) => {
              const count = Array.isArray(vArr) ? vArr.length : (typeof vArr === 'number' ? vArr : 0)
              totalVotes += count
              if (count > maxVotesCount) {
                maxVotesCount = count
                maxVotesIndex = idx
              }
            })

            // Check if current user voted
            const userVotedIndex = votes.findIndex((vArr) => Array.isArray(vArr) && vArr.includes(currentUserId))
            const hasVoted = userVotedIndex !== -1

            return (
              <div
                key={poll.id}
                style={{
                  background: poll.is_closed ? '#121920' : '#1a2129',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  opacity: poll.is_closed ? 0.75 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#f3f1ea' }}>{poll.question}</h4>
                    <span style={{ fontSize: '11px', color: '#9ba6ad', marginTop: '2px' }}>
                      {totalVotes} total votes · {poll.is_closed ? 'Closed' : 'Active'}
                    </span>
                  </div>
                  {isHost && !poll.is_closed && (
                    <button
                      onClick={() => onClosePoll(poll.id)}
                      style={{
                        padding: '4px 10px',
                        border: 'none',
                        color: '#ff5470',
                        background: 'rgba(255,84,112,0.14)',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'background-color 150ms'
                      }}
                    >
                      Close Early
                    </button>
                  )}
                </div>

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {pollOptions.map((option, idx) => {
                    const optVotes = votes[idx] ? (Array.isArray(votes[idx]) ? votes[idx].length : (typeof votes[idx] === 'number' ? votes[idx] : 0)) : 0
                    const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0
                    const isMajority = maxVotesCount > 0 && idx === maxVotesIndex
                    const didVoteThis = userVotedIndex === idx

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (!hasVoted && !poll.is_closed) {
                            haptics.pollVote()
                            onVotePoll(poll.id, idx)
                          }
                        }}
                        style={{
                          position: 'relative',
                          height: '40px',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 14px',
                          cursor: poll.is_closed ? 'default' : 'pointer',
                          transition: 'all 150ms ease'
                        }}
                      >
                        {/* Vote Percent Animation Bar */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            zIndex: 0,
                            background: didVoteThis ? 'rgba(255,106,44,0.16)' : 'rgba(255,255,255,0.06)'
                          }}
                        />

                        {/* Label Content */}
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#f3f1ea', zIndex: 10, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {option}
                          {didVoteThis && <span style={{ fontSize: '10px', color: '#ff6a2c' }}>(You)</span>}
                          {isMajority && (
                            <motion.span
                              initial={{ y: -15, opacity: 0, scale: 0.5 }}
                              animate={{ y: 0, opacity: 1, scale: 1 }}
                              transition={{
                                type: 'spring',
                                stiffness: 350,
                                damping: 15,
                                delay: 0.6
                              }}
                              style={{ display: 'inline-block' }}
                              title="Majority leader"
                            >
                              👑
                            </motion.span>
                          )}
                        </span>

                        {/* Percent Output */}
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ba6ad', zIndex: 10 }}>
                          <NumberTicker value={percentage} /> ({optVotes})
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Poll FAB */}
      <button
        onClick={handleOpenModal}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
          color: '#1a0e08',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '24px',
          border: 'none',
          boxShadow: '0 8px 24px rgba(255,106,44,0.3)',
          zIndex: 20,
          cursor: 'pointer'
        }}
      >
        ＋
      </button>

      {/* CreatePollModal overlay */}
      <AnimatePresence>
        {modalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,16,19,0.75)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: '380px',
                background: '#1a2129',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9ba6ad' }}>Create Group Poll</h4>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: '#9ba6ad', fontWeight: '700', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                {/* Question */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontWeight: '700', color: '#9ba6ad' }}>Poll Question</span>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g. What time should we start trekking?"
                    style={{
                      width: '100%',
                      height: '44px',
                      background: '#212b33',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '100px',
                      padding: '0 16px',
                      color: '#f3f1ea',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Options list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: '#9ba6ad' }}>Options (min 2, max 4)</span>
                    {options.length < 4 && (
                      <button
                        onClick={handleAddOption}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff6a2c',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        ＋ Add Option
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {options.map((option, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          style={{
                            flex: 1,
                            height: '38px',
                            background: '#212b33',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '100px',
                            padding: '0 16px',
                            color: '#f3f1ea',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        />
                        {options.length > 2 && (
                          <button
                            onClick={() => handleRemoveOption(idx)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: '#212b33',
                              border: 'none',
                              color: '#9ba6ad',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                style={{
                  width: '100%',
                  height: '44px',
                  background: 'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)',
                  color: '#1a0e08',
                  borderRadius: '100px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255,106,44,0.25)',
                  marginTop: '8px'
                }}
              >
                Launch Vote Poll
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PollsTab
export { PollsTab }
