import React from 'react'

/**
 * @typedef {Object} EmptyStateProps
 * @property {string} title - Primary feedback heading
 * @property {string} description - Brief instructions
 * @property {React.ReactNode} [illustration] - Custom SVG / Icon slot
 * @property {React.ReactNode} [action] - CTA Button or action slot
 */

/**
 * Troopp Common Empty State Placeholder.
 * @param {EmptyStateProps} props
 */
const EmptyState = ({ title, description, illustration, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-border border-dashed rounded-xl max-w-sm mx-auto shadow-sm">
      {/* Illustration Area */}
      <div className="w-24 h-24 mb-4 text-primary/40 flex items-center justify-center" aria-hidden="true">
        {illustration || (
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        )}
      </div>

      {/* Messages */}
      <h4 className="text-base font-heading font-bold text-text-primary mb-1">{title}</h4>
      <p className="text-xs text-text-secondary mb-5 leading-relaxed max-w-[280px]">
        {description}
      </p>

      {/* CTA Button Slot */}
      {action && <div className="flex items-center justify-center">{action}</div>}
    </div>
  )
}

export default EmptyState
export { EmptyState }
