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
    const filledOptions = options.map((o) => (typeof o === 'string' ? o.trim() : '')).filter(Boolean)
    if (!question.trim() || filledOptions.length < 2) return

    onCreatePoll({
      question: question.trim(),
      options: filledOptions
    })
    setModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-5 text-[#f3f1ea] relative min-h-[460px]">
      
      {/* Top Header & Actions */}
      <div className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#f3f1ea] font-display">Trip Room Polls</h3>
          <p className="text-xs text-[#9ba6ad] mt-1">
            Decide on departure times, meal spots, and group logistics together.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="h-9 px-4 bg-gradient-to-r from-[#ff6a2c] to-[#d9481a] hover:opacity-95 text-[#1a0e08] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <span>＋</span>
          <span>Create Poll</span>
        </button>
      </div>

      {/* Polls grid */}
      <div className="pb-16">
        {(!Array.isArray(polls) || polls.length === 0) ? (
          <div className="text-center py-16 bg-[#151c24] border border-[#242f3d] rounded-2xl flex flex-col items-center gap-2">
            <span className="text-3xl">📊</span>
            <h4 className="text-sm font-bold text-[#f3f1ea]">No active polls</h4>
            <p className="text-xs text-[#9ba6ad]">Create a poll to coordinate group votes and decisions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {polls.map((poll) => {
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
                  className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-3 shadow-lg transition-all ${
                    poll.is_closed ? 'bg-[#121920] border-white/5 opacity-80' : 'bg-[#151c24] border-[#242f3d]'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col min-w-0">
                      <h4 className="text-sm font-bold text-[#f3f1ea]">{poll.question}</h4>
                      <span className="text-[11px] text-[#9ba6ad] mt-0.5">
                        {totalVotes} total votes · {poll.is_closed ? 'Closed' : 'Active'}
                      </span>
                    </div>
                    {isHost && !poll.is_closed && (
                      <button
                        onClick={() => onClosePoll(poll.id)}
                        className="px-2.5 py-1 text-[10px] font-bold text-[#ff5470] bg-[rgba(255,84,112,0.12)] hover:bg-[rgba(255,84,112,0.2)] rounded-lg transition-colors cursor-pointer"
                      >
                        Close Early
                      </button>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="flex flex-col gap-2 mt-1">
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
                          className={`relative h-11 border rounded-xl overflow-hidden flex items-center justify-between px-3.5 transition-all ${
                            poll.is_closed ? 'cursor-default' : 'cursor-pointer hover:border-white/20'
                          } ${didVoteThis ? 'border-[#ff6a2c]' : 'border-white/10'}`}
                        >
                          {/* Vote Percent Animation Bar */}
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`absolute left-0 top-0 bottom-0 z-0 ${
                              didVoteThis ? 'bg-[rgba(255,106,44,0.18)]' : 'bg-white/5'
                            }`}
                          />

                          {/* Label Content */}
                          <span className="text-xs font-semibold text-[#f3f1ea] z-10 flex items-center gap-1.5">
                            <span>{option}</span>
                            {didVoteThis && <span className="text-[10px] font-bold text-[#ff6a2c]">(You)</span>}
                            {isMajority && (
                              <motion.span
                                initial={{ y: -15, opacity: 0, scale: 0.5 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 350,
                                  damping: 15,
                                  delay: 0.4
                                }}
                                className="inline-block"
                                title="Majority leader"
                              >
                                👑
                              </motion.span>
                            )}
                          </span>

                          {/* Percent Output */}
                          <span className="text-[11px] font-bold text-[#9ba6ad] z-10 font-mono">
                            <NumberTicker value={percentage} /> ({optVotes})
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
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
