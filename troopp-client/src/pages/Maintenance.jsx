import React from 'react'
import { motion } from 'framer-motion'

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-center flex flex-col gap-6"
      >
        <span className="text-5xl self-center animate-spin">🛠️</span>
        
        <div className="flex flex-col gap-1">
          <h2 className="font-heading font-black text-2xl text-stone-900 tracking-tight">
            System Upgrades Active
          </h2>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Back shortly
          </p>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed">
          Troopp is currently undergoing scheduled backend performance calibrations and security updates. All trip rooms check-ins, checklists edits, and ledgers remain cached.
        </p>

        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
          Thank you for your patience.
        </div>
      </motion.div>
    </div>
  )
}

export default Maintenance
