import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { getTextColorForBackground } from '../../utils/colorUtils.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'

/**
 * Reusable Vibe Badge component with staggered emoji drops and text slides, plus hover indicators.
 */
const VibeBadge = ({ vibe = '🌍 Weekend Explorer', index = 0, className }) => {
  const reduced = useReducedMotion()

  // Parse emoji and text safely
  const parseVibe = (text) => {
    if (!text) return { emoji: '🌍', label: 'Weekend Explorer' }
    const emojiMatch = text.match(/^([\p{Emoji}\u200d]+)\s*(.*)$/u)
    if (emojiMatch) {
      return { emoji: emojiMatch[1], label: emojiMatch[2] }
    }
    return { emoji: '🌍', label: text }
  }

  const { emoji, label } = parseVibe(vibe)

  // Assign hover animation class (suppressed if reduced motion is requested)
  const isNightOwl = label.toLowerCase().includes('night') || label.toLowerCase().includes('owl')
  const hoverClass = reduced ? '' : (isNightOwl ? 'hover-rotate' : 'hover-wobble')

  const delayOffset = reduced ? 0 : index * 0.06

  // Background color check to ensure WCAG 4.5:1 ratio contrast compliance
  let bgHex = '#1C1917' // Default bg-stone-900 equivalent
  if (className) {
    if (className.includes('bg-emerald-100')) bgHex = '#D1FAE5'
    else if (className.includes('bg-blue-100')) bgHex = '#DBEAFE'
    else if (className.includes('bg-stone-100')) bgHex = '#F5F5F4'
    else if (className.includes('bg-primary-light') || className.includes('bg-amber-100')) bgHex = '#FEF3C7'
    else if (className.includes('bg-stone-900')) bgHex = '#1C1917'
    else if (className.includes('bg-primary')) bgHex = '#F97316'
  }

  const textColor = getTextColorForBackground(bgHex, '#FFFFFF', '#1C1917')

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 font-sans font-bold bg-stone-900/80 backdrop-blur-md text-white rounded-full select-none shadow-sm text-[10px] px-2.5 h-6 cursor-default overflow-hidden border border-white/10',
        hoverClass,
        className
      )}
      style={{ color: textColor }}
    >
      {/* Playful Emoji Drop */}
      <motion.span
        initial={{ y: reduced ? 0 : -5, scale: reduced ? 1 : 0 }}
        animate={{ y: 0, scale: 1 }}
        transition={{
          delay: delayOffset,
          type: 'spring',
          stiffness: 300,
          damping: 14,
          duration: reduced ? 0 : undefined
        }}
        className="vibe-emoji inline-block origin-bottom select-none"
        aria-hidden="true"
      >
        {emoji}
      </motion.span>

      {/* Slide-in Text */}
      <motion.span
        initial={{ x: reduced ? 0 : 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{
          delay: delayOffset + (reduced ? 0 : 0.1),
          duration: reduced ? 0 : 0.25,
          ease: 'easeOut'
        }}
        className="text-[10px] font-bold select-none tracking-wide"
        style={{ color: textColor }}
      >
        {label}
      </motion.span>
    </div>
  )
}

export default VibeBadge
export { VibeBadge }
