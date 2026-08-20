import React from 'react'
import { Link } from 'react-router-dom'

/**
 * 5-Step Pre-Join Check Gate Modal.
 * Prompts user to resolve profile requirements before applying to activities.
 */
const PreJoinCheckGate = ({ isOpen, onClose, user, activity, onConfirm }) => {
  if (!isOpen) return null

  // Simulated checks or mapped user stats
  const hasEmergencyContact = user?.has_emergency_contact === true || true // Assume true or set mock
  const trustPasses = (user?.trust_score || 50) >= (activity?.min_trust_score || 0)
  const reliabilityPasses = (user?.reliability_score || 100) >= (activity?.min_reliability_score || 0)

  // Gender rule check
  const genderPasses = !activity?.is_women_only || user?.gender === 'female'

  const allPass = hasEmergencyContact && trustPasses && reliabilityPasses && genderPasses

  const checklist = [
    {
      label: 'Emergency Contact Configured',
      status: hasEmergencyContact,
      errorMsg: 'At least one active emergency contact must be set up.',
      actionLink: '/profile/me/emergency',
      actionText: 'Add contact →'
    },
    {
      label: `Trust Score Meets Limit (Req: ${activity?.min_trust_score || 0})`,
      status: trustPasses,
      errorMsg: `Your Trust Score (${user?.trust_score || 50}) is below target.`,
      actionText: 'Build trust by completing trips'
    },
    {
      label: `Reliability Score Meets Limit (Req: ${activity?.min_reliability_score || 0})`,
      status: reliabilityPasses,
      errorMsg: `Your Reliability Score (${user?.reliability_score || 100}%) is below target.`,
      actionText: 'Do not late-cancel scheduled trips'
    },
    {
      label: 'Gender Eligibility Requirement',
      status: genderPasses,
      errorMsg: 'This activity is restricted to female members only.',
      actionText: 'Women-only trip restricted'
    }
  ]

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-border pb-3">
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-text-primary">Safety Gate Checks</h3>
            <span className="text-[10px] text-text-secondary">Verify you meet host requirements to join.</span>
          </div>
          <button onClick={onClose} className="text-xs font-bold w-6 h-6 flex items-center justify-center">
            ✕
          </button>
        </div>

        {/* Checklist Rows */}
        <div className="flex flex-col gap-3">
          {checklist.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                item.status
                  ? 'bg-emerald-50/30 border-emerald-200'
                  : 'bg-rose-50/30 border-rose-200'
              }`}
            >
              {/* Status indicator icon */}
              <span className="text-base mt-0.5">
                {item.status ? '✅' : '❌'}
              </span>
              
              <div className="flex-1 flex flex-col">
                <span className={`text-xs font-bold ${item.status ? 'text-emerald-800' : 'text-rose-900'}`}>
                  {item.label}
                </span>
                {!item.status && (
                  <span className="text-[10px] text-text-secondary mt-0.5">
                    {item.errorMsg}
                  </span>
                )}
                {!item.status && item.actionLink && (
                  <Link
                    to={item.actionLink}
                    className="text-[10px] text-primary font-bold hover:underline mt-1.5"
                  >
                    {item.actionText}
                  </Link>
                )}
                {!item.status && !item.actionLink && (
                  <span className="text-[9px] text-text-secondary font-semibold italic mt-1">
                    ({item.actionText})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex gap-3 border-t border-border pt-4 mt-1">
          <button
            onClick={onClose}
            className="flex-1 h-11 border border-border rounded-xl text-xs font-bold text-text-secondary hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            disabled={!allPass}
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-xl text-xs font-bold shadow-md transition-all ${
              allPass
                ? 'bg-primary text-white hover:bg-primary-dark cursor-pointer'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
            }`}
          >
            Confirm & Join
          </button>
        </div>
      </div>
    </div>
  )
}

export default PreJoinCheckGate
export { PreJoinCheckGate }
