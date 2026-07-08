import React from 'react'
import { motion } from 'framer-motion'

const Offline = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-xl text-center flex flex-col gap-6"
      >
        <span className="text-5xl self-center">📡</span>
        
        <div className="flex flex-col gap-1">
          <h2 className="font-heading font-black text-2xl text-stone-900 tracking-tight">
            Connection Lost
          </h2>
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
            Browser Offline
          </p>
        </div>

        <p className="text-xs text-stone-505 leading-relaxed">
          It looks like you are not connected to the internet. Please check your network cables or Wi-Fi settings to reconnect to Troopp trip rooms.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="w-full h-11 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-850 transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </motion.div>
    </div>
  )
}

export default Offline
