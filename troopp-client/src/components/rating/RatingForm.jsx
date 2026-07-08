import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '../common/Avatar.jsx'

/**
 * Question slider sheet to rate co-travelers behaviorally.
 */
const RatingForm = ({ members = [], onSubmit }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Track questionnaire answers: { [userId]: { respectful: null, follow_decisions: null, comfortable: null, travel_again: null } }
  const [answers, setAnswers] = useState({})

  const currentMember = members[currentIndex]
  
  const handleAnswerSelect = (field, value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentMember.userId]: {
        ...(prev[currentMember.userId] || {}),
        [field]: value
      }
    }))
  }

  const handleNext = () => {
    if (currentIndex < members.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Structure batch payload array
      const ratingsArray = members.map((m) => {
        const ans = answers[m.userId] || {}
        return {
          ratee_id: m.userId,
          respectful: ans.respectful === 'yes',
          follow_decisions: ans.follow_decisions === 'yes',
          comfortable: ans.comfortable === 'yes',
          travel_again: ans.travel_again || 'maybe',
          showed_up: true,
          comment: ''
        }
      })
      onSubmit(ratingsArray)
    }
  }

  if (members.length === 0) return null

  const currentAnswers = answers[currentMember.userId] || {}
  const isStepValid =
    currentAnswers.respectful !== undefined &&
    currentAnswers.follow_decisions !== undefined &&
    currentAnswers.comfortable !== undefined &&
    currentAnswers.travel_again !== undefined

  return (
    <div className="flex flex-col gap-5 flex-grow">
      
      {/* Progress header bar */}
      <div className="flex justify-between items-center text-[10px] font-bold text-text-secondary uppercase">
        <span>Rating co-travelers</span>
        <span>
          Member {currentIndex + 1} of {members.length}
        </span>
      </div>

      <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / members.length) * 100}%` }}
        />
      </div>

      {/* Main Form Body with slider animation */}
      <div className="bg-stone-50/50 border border-border/80 rounded-2xl p-5 relative overflow-hidden min-h-[360px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMember.userId}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4 flex-1 justify-between"
          >
            {/* Top Member Card */}
            <div className="flex flex-col items-center gap-2 border-b border-border pb-3.5 text-center">
              <Avatar size="lg" name={currentMember.name} src={currentMember.avatarUrl} />
              <h4 className="text-sm font-extrabold text-text-primary mt-1">{currentMember.name}</h4>
            </div>

            {/* Questions lists */}
            <div className="flex flex-col gap-4 py-3">
              {/* Q1: Respectful */}
              <div className="flex justify-between items-center gap-3">
                <span className="text-[11px] font-bold text-text-secondary">Was {currentMember.name.split(' ')[0]} respectful?</span>
                <div className="flex gap-2">
                  {['yes', 'no'].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleAnswerSelect('respectful', val)}
                      className={`h-8 px-3 rounded-lg text-[10px] font-bold capitalize transition-all ${
                        currentAnswers.respectful === val
                          ? 'bg-stone-850 text-white shadow-sm'
                          : 'border border-border bg-white text-text-secondary hover:bg-stone-50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2: Follow Decisions */}
              <div className="flex justify-between items-center gap-3">
                <span className="text-[11px] font-bold text-text-secondary">Did they follow group decisions?</span>
                <div className="flex gap-2">
                  {['yes', 'no'].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleAnswerSelect('follow_decisions', val)}
                      className={`h-8 px-3 rounded-lg text-[10px] font-bold capitalize transition-all ${
                        currentAnswers.follow_decisions === val
                          ? 'bg-stone-850 text-white shadow-sm'
                          : 'border border-border bg-white text-text-secondary hover:bg-stone-50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3: Vibe Comfort */}
              <div className="flex justify-between items-center gap-3">
                <span className="text-[11px] font-bold text-text-secondary">Did they make others comfortable?</span>
                <div className="flex gap-2">
                  {['yes', 'no'].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleAnswerSelect('comfortable', val)}
                      className={`h-8 px-3 rounded-lg text-[10px] font-bold capitalize transition-all ${
                        currentAnswers.comfortable === val
                          ? 'bg-stone-850 text-white shadow-sm'
                          : 'border border-border bg-white text-text-secondary hover:bg-stone-50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q4: Travel Again (Ternary) */}
              <div className="flex justify-between items-center gap-3">
                <span className="text-[11px] font-bold text-text-secondary">Would you travel with them again?</span>
                <div className="flex gap-1.5">
                  {['yes', 'maybe', 'no'].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleAnswerSelect('travel_again', val)}
                      className={`h-8 px-2.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                        currentAnswers.travel_again === val
                          ? 'bg-stone-850 text-white shadow-sm'
                          : 'border border-border bg-white text-text-secondary hover:bg-stone-50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Buttons Controls */}
        <div className="border-t border-border pt-4 mt-4 flex gap-3">
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex(currentIndex - 1)}
              className="flex-1 h-11 border border-border hover:bg-stone-50 text-text-secondary rounded-xl text-xs font-bold transition-colors"
            >
              Back
            </button>
          )}
          <button
            disabled={!isStepValid}
            onClick={handleNext}
            className={`h-11 rounded-xl text-xs font-bold transition-colors shadow-md ${
              currentIndex > 0 ? 'flex-1' : 'w-full'
            } ${
              isStepValid
                ? 'bg-primary text-white hover:bg-primary-dark cursor-pointer'
                : 'bg-stone-100 text-stone-300 border cursor-not-allowed'
            }`}
          >
            {currentIndex === members.length - 1 ? 'Submit All Ratings' : 'Next Co-Traveler'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RatingForm
export { RatingForm }
