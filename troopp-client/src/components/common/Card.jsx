import React from 'react'
import clsx from 'clsx'

/**
 * @typedef {Object} CardProps
 * @property {React.ReactNode} children - Card slot content
 * @property {boolean} [hoverGlow] - Adds translation and drop shadows on hover
 * @property {string} [className] - Extends card className
 * @property {() => void} [onClick] - Click trigger callback
 */

/**
 * Troopp Common Base Card.
 * @param {CardProps} props
 */
const Card = ({ children, hoverGlow = false, className, onClick }) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={clsx(
        'bg-surface border border-border rounded-xl shadow-md p-4 transition-all duration-200 overflow-hidden',
        hoverGlow && 'hover:-translate-y-1 hover:shadow-lg focus:ring-2 focus:ring-primary/40 focus:outline-none',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Troopp Common Glassmorphic Card (Layer 1 Visual Style).
 * @param {CardProps} props
 */
const GlassCard = ({ children, hoverGlow = false, className, onClick }) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={clsx(
        'glass-card p-4 transition-all overflow-hidden',
        hoverGlow && 'glass-card-hover focus:ring-2 focus:ring-primary/40 focus:outline-none',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export default Card
export { Card, GlassCard }
