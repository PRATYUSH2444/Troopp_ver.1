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
 * Follows the standard Troopp card and spacing system.
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
    haptics.lightTap?.()
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

  const handleSubmit = (e) => {
    e.preventDefault()
    const filledOptions = options.map((o) => (typeof o === 'string' ? o.trim() : '')).filter(Boolean)
    if (!question.trim() || filledOptions.length < 2) return

    onCreatePoll({
      question: question.trim(),
      options: filledOptions
    })
    setModalOpen(false)
  }

  const safePolls = Array.isArray(polls) ? polls : []

  return (
    <div className="flex flex-col gap-6 text-[#f3f1ea] pb-16">
      
      {/* 1. TOP HEADER & ACTION BAR */}
      <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#f3f1ea] font-display">
            📊 Trip Decision Polls
          </h3>
          <p className="text-xs text-[#9ba6ad] mt-1">
            Vote together on route checkpoints, departure timing, and group arrangements.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="h-10 px-5 bg-gradient-to-r from-[#ff6a2c] to-[#d9481a] hover:opacity-90 text-[#1a0e08] rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#ff6a2c]/20 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <span>＋</span>
          <span>Create Poll</span>
        </button>
      </div>

      {/* 2. MAIN CONTENT CARD */}
      <div className="bg-[#1a2129] border border-white/10 rounded-[20px] p-5 sm:p-6 min-h-[460px] shadow-xl flex flex-col">
        {safePolls.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#10151a] border border-white/5 flex items-center justify-center text-3xl shadow-inner">
              📊
            </div>
            <h4 className="text-base font-bold text-[#f3f1ea] mt-1 font-display">
              No active group polls
            </h4>
            <p className="text-xs text-[#9ba6ad] max-w-sm leading-relaxed">
              Create a vote to decide on departure checkpoints, meal spots, or activities with all travelers.
            </p>
            <button
              onClick={handleOpenModal}
              className="mt-2 h-10 px-6 bg-[#10151a] hover:bg-white/5 border border-white/10 hover:border-[#ff6a2c]/50 text-xs font-bold text-[#f3f1ea] rounded-full flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>＋</span>
              <span>Create First Poll</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {safePolls.map((poll) => {
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
                  className={`p-4 sm:p-5 rounded-xl border flex flex-col gap-3.5 shadow-md transition-all ${
                    poll.is_closed ? 'bg-[#121920] border-white/5 opacity-80' : 'bg-[#1a2129] border-white/5'
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
                  <div className="flex flex-col gap-2">
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
                              haptics.pollVote?.()
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
                          <span className="text-xs font-semibold text-[#f3f1ea] z-10 flex items-center gap-1.5 truncate pr-2">
                            <span className="truncate">{option}</span>
                            {didVoteThis && <span className="text-[10px] font-bold text-[#ff6a2c] flex-shrink-0">(You)</span>}
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
                                className="inline-block flex-shrink-0"
                                title="Majority leader"
                              >
                                👑
                              </motion.span>
                            )}
                          </span>

                          {/* Percent Output */}
                          <span className="text-[11px] font-bold text-[#9ba6ad] z-10 font-mono flex-shrink-0">
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

      {/* 3. CREATE POLL MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#151c24] border border-[#242f3d] rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="text-sm font-bold text-[#f3f1ea] font-display">
                  Create Group Poll
                </h4>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-[#9ba6ad] hover:text-white text-base cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#9ba6ad]">Question</label>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g. What time should we start trekking?"
                    autoFocus
                    className="w-full bg-[#1a2129] border border-white/10 rounded-xl p-3 text-xs text-[#f3f1ea] outline-none focus:border-[#ff6a2c]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[#9ba6ad]">Options (2 to 4)</label>
                    {options.length < 4 && (
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="text-[11px] font-bold text-[#ff6a2c] hover:underline cursor-pointer"
                      >
                        ＋ Add Option
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 bg-[#1a2129] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#f3f1ea] outline-none focus:border-[#ff6a2c]"
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="w-8 h-8 rounded-lg bg-[#212b33] text-[#9ba6ad] hover:text-[#ff5470] text-xs font-bold flex items-center justify-center cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 h-10 border border-white/10 bg-[#1a2129] rounded-xl text-[#9ba6ad] text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
                    className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      question.trim() && options.filter((o) => o.trim()).length >= 2
                        ? 'bg-gradient-to-r from-[#ff6a2c] to-[#d9481a] text-[#1a0e08] shadow-md'
                        : 'bg-white/5 text-[#6b757c] cursor-not-allowed'
                    }`}
                  >
                    Launch Poll
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PollsTab
export { PollsTab }
