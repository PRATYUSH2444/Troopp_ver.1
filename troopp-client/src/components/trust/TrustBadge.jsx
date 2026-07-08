import React from 'react'
import clsx from 'clsx'

/**
 * @typedef {Object} TrustBadgeProps
 * @property {number} score - The user's trust score
 * @property {boolean} [isFlagged] - Force the badge into a flagged state
 * @property {'sm' | 'md' | 'lg'} [size] - Dimensions and font sizing
 */

/**
 * TrustBadge Component celebrating trust level tiers and safety tags.
 * @param {TrustBadgeProps} props
 */
export const TrustBadge = ({ score, isFlagged = false, size = 'md' }) => {
  // Sizing styles
  const badgeSizeStyles = {
    sm: {
      padding: '3px 8px',
      fontSize: '10px'
    },
    md: {
      padding: '4px 12px',
      fontSize: '11px'
    },
    lg: {
      padding: '6px 16px',
      fontSize: '13px'
    }
  }

  const iconClasses = {
    sm: 'w-3 h-3',
    md: 'w-[14px] h-[14px]',
    lg: 'w-4 h-4'
  }

  // Variant matching
  let badgeText = 'New'
  let bgStyles = 'bg-stone-100 text-stone-600 border border-stone-200'
  let icon = null

  const iconClass = clsx('flex-shrink-0', iconClasses[size])

  if (isFlagged) {
    badgeText = 'Flagged'
    bgStyles = 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
    icon = (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    )
  } else if (score >= 75) {
    badgeText = 'Trusted'
    bgStyles = 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
    icon = (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M2.166 4.9c0-.77.587-1.42 1.34-1.504A15.006 15.006 0 0110 2c2.812 0 5.438.775 7.494 1.396.753.084 1.34.733 1.34 1.504v3.136c0 5.253-3.262 9.544-7.834 11.233a1.003 1.003 0 01-.66 0C5.762 17.58 2.5 13.29 2.5 8.036V4.9zm10.33 4.87a1 1 0 00-1.414-1.414l-3.25 3.25-1.25-1.25a1 1 0 10-1.414 1.414l1.957 1.958a1 1 0 001.414 0l3.957-3.958z" clipRule="evenodd" />
      </svg>
    )
  } else if (score >= 50) {
    badgeText = 'Verified'
    bgStyles = 'bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE]'
    icon = (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a1 1 0 00-1.414-1.414L9 10.586 7.557 9.143a1 1 0 00-1.414 1.414l2.122 2.122a1 1 0 001.414 0l4.323-4.323z" clipRule="evenodd" />
      </svg>
    )
  } else {
    badgeText = 'New'
    bgStyles = 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]'
    icon = (
      <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wider select-none',
        bgStyles
      )}
      style={badgeSizeStyles[size]}
    >
      {icon}
      <span>{badgeText}</span>
    </div>
  )
}

export default TrustBadge
