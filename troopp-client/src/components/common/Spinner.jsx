import React from 'react'
import clsx from 'clsx'

/**
 * @typedef {Object} SpinnerProps
 * @property {'sm' | 'md' | 'lg'} [size] - Diameter size of the loader
 * @property {'primary' | 'white'} [color] - Spinner color
 * @property {string} [className] - Additional wrapper style overrides
 */

/**
 * Troopp Common Spinner Loader.
 * @param {SpinnerProps} props
 */
const Spinner = ({ size = 'md', color = 'primary', className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3'
  }

  const colorClasses = {
    primary: 'border-primary/20 border-t-primary',
    white: 'border-white/20 border-t-white'
  }

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={clsx(
        'rounded-full animate-spin-custom',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default Spinner
export { Spinner }
