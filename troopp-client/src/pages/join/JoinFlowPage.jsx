import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import JoinIntentSelector from '../../components/join/JoinIntentSelector.jsx'
import RequestSentScreen from '../../components/join/RequestSentScreen.jsx'
import Spinner from '../../components/common/Spinner.jsx'

const JoinFlowPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // State
  const [step, setStep] = useState(1) // 1: preview, 2: intent, 3: confirm, 4: success
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState(null)
  const [intent, setIntent] = useState('confirm') // 'confirm' | 'request'

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        await new Promise((r) => setTimeout(r, 400)) // Simulation latency
        setActivity({
          id,
          title: 'Harishchandragad Monsoon Trek & Night Camping',
          destination: 'Bhandardara, Maharashtra',
          cost_per_person: 1800,
          max_group_size: 12,
          current_members: 8,
          is_women_only: false,
          min_trust_score: 50,
          min_reliability_score: 80,
          Creator: {
            Profile: {
              name: 'Raj Malhotra'
            }
          }
        })
      } finally {
        setLoading(false)
      }
    }
    fetchActivity()
  }, [id])

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
    else navigate(`/activities/${id}`)
  }

  const handleSubmitRequest = async () => {
    setLoading(true)
    try {
      // Mock join API dispatch: axios.post(`/api/v1/activities/${id}/join`, { intent })
      await new Promise((r) => setTimeout(r, 800))
      setStep(4) // Set to success sent screen
    } finally {
      setLoading(false)
    }
  }

  if (loading && !activity) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 pb-20">
      {/* Header Back Controls */}
      {step < 4 && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-10 h-10 border border-border rounded-xl hover:bg-stone-50 flex items-center justify-center text-xs font-bold"
          >
            ←
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-text-secondary uppercase">Join Application</span>
            <h2 className="text-sm font-extrabold text-text-primary">
              Step {step} of 3
            </h2>
          </div>
        </div>
      )}

      {/* Primary Card Viewport */}
      <div className="glass-card p-6 min-h-[360px] flex flex-col justify-between shadow-lg">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="md" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <h3 className="text-sm font-bold text-text-primary">Confirm Group Selection</h3>
                
                <div className="p-4 bg-stone-50 border border-border/80 rounded-2xl flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Target Trip</span>
                  <span className="text-xs font-bold text-text-primary leading-snug">{activity.title}</span>
                  <span className="text-[10px] text-text-secondary mt-1">📍 Destination: {activity.destination}</span>
                </div>

                <div className="flex flex-col gap-1 text-[11px] text-text-secondary leading-relaxed bg-stone-50/50 p-3 rounded-xl border border-dashed border-border">
                  <span>📊 Slots Occupied: {activity.current_members} / {activity.max_group_size}</span>
                  <span>🔒 Women-Only: {activity.is_women_only ? 'Female Only' : 'Open to all'}</span>
                  <span>💰 Cost per head: ₹{activity.cost_per_person}</span>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-3"
              >
                <JoinIntentSelector selectedIntent={intent} onChange={setIntent} />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4"
              >
                <h3 className="text-sm font-bold text-text-primary">Complete Verification Check</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  By submitting your join request, your trust metrics (Trust Score: 80, Reliability: 95%) will be visible to the host {activity.Creator?.Profile?.name}.
                </p>
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
                  <span className="text-emerald-800 text-sm">🛡️</span>
                  <span className="text-[10px] font-semibold text-emerald-950">
                    You meet all host safety requirements for this activity.
                  </span>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <RequestSentScreen hostName={activity.Creator?.Profile?.name} />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Buttons Controls */}
        {step < 4 && (
          <div className="flex gap-3 border-t border-border pt-4 mt-6">
            <button
              onClick={handleBack}
              className="flex-1 h-11 border border-border rounded-xl text-xs font-bold text-text-secondary hover:bg-stone-50"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex-1 h-11 bg-stone-850 hover:bg-stone-900 text-white rounded-xl text-xs font-bold shadow-md ml-auto"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmitRequest}
                className="flex-1 h-11 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-dark ml-auto"
              >
                Submit Request 🚀
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default JoinFlowPage
export { JoinFlowPage }
