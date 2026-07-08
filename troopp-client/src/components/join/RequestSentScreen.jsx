import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

/**
 * Screen rendering success details after join application has been posted.
 */
const RequestSentScreen = ({ hostName = 'the host' }) => {
  return (
    <div className="w-full max-w-sm mx-auto text-center py-10 flex flex-col items-center justify-center gap-5">
      {/* Animated Check Container */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 200, damping: 15 } }}
        className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-4xl shadow-inner"
      >
        📨
      </motion.div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-extrabold text-text-primary">
          Request Sent to {hostName}!
        </h3>
        <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
          Your request intent has been registered. We have notified the host to audit your trust profile.
        </p>
      </div>

      {/* Response timer */}
      <div className="bg-stone-50 border border-border/80 p-3 rounded-xl w-full text-[11px] font-semibold text-text-secondary">
        🕒 Average response window: Under 2 hours.
      </div>

      <Link
        to="/feed"
        className="w-full h-11 bg-primary text-white font-bold rounded-xl flex items-center justify-center text-xs shadow-md hover:bg-primary-dark transition-colors mt-2"
      >
        Back to Activity Feed
      </Link>
    </div>
  )
}

export default RequestSentScreen
export { RequestSentScreen }
