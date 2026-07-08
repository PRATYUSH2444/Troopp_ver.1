import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * Reusable animated Toggle Switch with spring slide and liquid fill.
 */
const Toggle = ({ checked, onChange, disabled = false, className }) => {
  return (
    <label
      className={clsx(
        'relative inline-flex items-center cursor-pointer select-none',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        className="sr-only"
      />
      {/* Toggle Track with liquid fill gradient background */}
      <motion.div
        animate={{
          backgroundPosition: checked ? '0% 50%' : '100% 50%'
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          backgroundImage: 'linear-gradient(to right, var(--color-primary) 50%, var(--color-border) 50%)',
          backgroundSize: '200% 100%'
        }}
        className="w-10 h-5.5 rounded-full relative overflow-hidden transition-colors"
      >
        {/* Toggle Thumb */}
        <motion.div
          animate={{
            x: checked ? 18 : 2,
            scaleX: 1.0
          }}
          whileTap={{
            scaleX: 0.85
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 25
          }}
          className="w-4.5 h-4.5 bg-white rounded-full absolute top-0.5 shadow-sm"
        />
      </motion.div>
    </label>
  )
}

export default Toggle
export { Toggle }
