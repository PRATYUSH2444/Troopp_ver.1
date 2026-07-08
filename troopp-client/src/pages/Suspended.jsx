import React from 'react'
import { motion } from 'framer-motion'

const Suspended = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-center flex flex-col gap-6"
      >
        <span className="text-5xl self-center">⏳</span>
        
        <div className="flex flex-col gap-2">
          <h2 className="font-heading font-black text-2xl text-stone-900 tracking-tight">
            Account Temporarily Suspended
          </h2>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">
            Compliance Penalty Active
          </p>
        </div>

        <p className="text-xs text-stone-505 leading-relaxed">
          Your account has been temporarily suspended due to a safety strike or recent host grievance reports. During this period, you will not be able to host or join any shared activities.
        </p>

        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl text-left text-xs font-bold text-amber-805 flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">Compliance Checkpoint</span>
          <p className="font-medium text-[11px] leading-relaxed text-amber-800">
            Please check your registered email address for specific details regarding suspension timelines, compliance criteria, and active strike numbers.
          </p>
        </div>

        <a
          href="mailto:support@troopp.in"
          className="w-full h-11 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center justify-center hover:bg-stone-850 transition-colors"
        >
          Contact Safety Support
        </a>
      </motion.div>
    </div>
  )
}

export default Suspended
