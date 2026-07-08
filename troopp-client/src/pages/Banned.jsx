import React from 'react'
import { motion } from 'framer-motion'

const Banned = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-center flex flex-col gap-6"
      >
        <span className="text-5xl self-center animate-bounce">🔒</span>
        
        <div className="flex flex-col gap-2">
          <h2 className="font-heading font-black text-2xl text-stone-900 tracking-tight">
            Account Permanently Banned
          </h2>
          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
            Community Guidelines Violation
          </p>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed">
          Your account has been permanently restricted from accessing the Troopp platform due to multiple severe grievance violations or fraudulent identity verifications. In accordance with safety policies, your trust points are frozen.
        </p>

        <div className="bg-stone-50 border border-stone-150 p-4 rounded-2xl flex flex-col gap-1 text-[10px] font-bold text-stone-605 uppercase tracking-wider text-left">
          <div>🚫 No new registrations permitted</div>
          <div>🚫 ID document credentials blacklisted</div>
          <div>🚫 Active group rooms withdrawn</div>
        </div>

        <a
          href="mailto:appeals@troopp.in"
          className="w-full h-11 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center justify-center hover:bg-stone-850 transition-colors"
        >
          Submit Compliance Appeal
        </a>
      </motion.div>
    </div>
  )
}

export default Banned
