import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * Reusable animated Checkbox with SVG self-drawing stroke paths.
 */
const Checkbox = ({ checked, onChange, label, className }) => {
  return (
    <label className={clsx('flex items-center gap-2.5 cursor-pointer select-none', className)}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <motion.div
          animate={{
            borderColor: checked ? 'var(--color-primary)' : 'var(--color-border)',
            backgroundColor: checked ? 'rgba(249, 115, 22, 0.05)' : 'rgba(255, 255, 255, 1)'
          }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5 border-2 rounded-md flex items-center justify-center overflow-hidden bg-white"
        >
          <svg
            className="w-3.5 h-3.5 text-primary stroke-current"
            viewBox="0 0 12 12"
            fill="none"
          >
            <motion.path
              d="M2.5 6l2.5 2.5 4.5-4.5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: checked ? 1 : 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            />
          </svg>
        </motion.div>
      </div>
      {label && <span className="text-[11px] font-semibold text-stone-600">{label}</span>}
    </label>
  )
}

export default Checkbox
export { Checkbox }
