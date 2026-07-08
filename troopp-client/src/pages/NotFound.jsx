import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-center flex flex-col gap-6"
      >
        <span className="text-5xl self-center">🧭</span>
        
        <div className="flex flex-col gap-1">
          <h2 className="font-heading font-black text-2xl text-stone-900 tracking-tight">
            Page Not Found
          </h2>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Error 404
          </p>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed">
          The coordinates you entered don't point to any active routes on Troopp. Please check the URL or return to safety.
        </p>

        <Link
          to="/feed"
          className="w-full h-11 bg-stone-900 text-white rounded-xl text-xs font-bold flex items-center justify-center hover:bg-stone-850 transition-colors"
        >
          Return to Feed
        </Link>
      </motion.div>
    </div>
  )
}

export default NotFound
