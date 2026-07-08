import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * @typedef {Object} ButtonProps
 * @property {React.ReactNode} [children] - Content of the button
 * @property {'primary' | 'secondary' | 'ghost' | 'danger'} [variant] - Visual style variant
 * @property {'sm' | 'md' | 'lg'} [size] - Button sizing scale
 * @property {boolean} [loading] - Replaces content with a spinner when active
 * @property {boolean} [disabled] - Disables interactions and applies disabled styles
 * @property {React.ReactNode} [leftIcon] - Left side icon slot
 * @property {React.ReactNode} [rightIcon] - Right side icon slot
 * @property {boolean} [fullWidth] - Extends button width to 100% of container
 * @property {() => void} [onClick] - Click handler function
 * @property {string} [type] - HTML button type ('button', 'submit', 'reset')
 * @property {string} [ariaLabel] - Accessible label for screen readers
 */

/**
 * Troopp Common Button Component.
 * @param {ButtonProps} props
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  fullWidth = false,
  onClick,
  type = 'button',
  ariaLabel
}) => {
  const isButtonDisabled = disabled || loading

  // Sizing definitions
  const sizeClasses = {
    sm: 'h-10 px-[14px] text-[15px]',
    md: 'h-12 px-5 text-[15px]',
    lg: 'h-14 px-[28px] text-[15px]'
  }

  // Variant classes (excluding animations and borders handled via inline styles / variants)
  const variantClasses = {
    primary: 'text-white border-none font-bold',
    secondary: 'bg-white text-primary border-[1.5px] border-primary font-bold',
    ghost: 'bg-transparent text-text-secondary border-[1.5px] border-border font-bold',
    danger: 'text-danger border-[1.5px] border-danger font-bold'
  }

  const baseStyles = 'relative inline-flex items-center justify-center select-none outline-none rounded-md font-body gap-2 transition-[background-color,border-color,color,box-shadow,transform] duration-150 cursor-pointer'

  const buttonClasses = clsx(
    baseStyles,
    sizeClasses[size],
    variantClasses[variant],
    fullWidth && 'w-full',
    isButtonDisabled && 'opacity-50 cursor-not-allowed pointer-events-none shadow-none!'
  )

  // Configure tap and hover animations based on variant
  const hoverAnimation = !isButtonDisabled
    ? {
        primary: { y: -1, boxShadow: '0 6px 18px rgba(249,115,22,0.45)' },
        secondary: { backgroundColor: 'var(--color-primary-light)' },
        ghost: { backgroundColor: '#F9FAFB', borderColor: 'var(--color-text-secondary)' },
        danger: { backgroundColor: 'var(--color-danger)', color: '#ffffff' }
      }[variant]
    : {}

  const tapAnimation = !isButtonDisabled
    ? {
        primary: { y: 0, scale: 0.98, boxShadow: '0 2px 8px rgba(249,115,22,0.25)' },
        secondary: { scale: 0.98 },
        ghost: { scale: 0.98 },
        danger: { scale: 0.98 }
      }[variant]
    : {}

  // Apply gradient backgrounds or colors via style prop to ensure accuracy
  const style = {
    ...(variant === 'primary' && {
      background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
      boxShadow: '0 4px 14px rgba(249,115,22,0.35)'
    }),
    ...(variant === 'danger' && {
      background: 'var(--color-danger-bg, var(--color-danger-light, #FEE2E2))'
    })
  }

  return (
    <motion.button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={isButtonDisabled}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      transition={{ duration: 0.15 }}
      style={style}
    >
      {loading ? (
        <svg className={clsx("animate-spin h-4 w-4", (variant === 'secondary' || variant === 'ghost') ? 'text-primary' : 'text-white')} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  )
}

export default Button
export { Button }
