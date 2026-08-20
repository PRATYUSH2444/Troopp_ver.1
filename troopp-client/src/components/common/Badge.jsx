import React from 'react'
import clsx from 'clsx'

/**
 * @typedef {Object} BadgeProps
 * @property {'trust' | 'vibe' | 'activity'} type - Badge type to render
 * @property {number} [score] - User trust score (0-100), required for trust badges
 * @property {boolean} [isFlagged] - Force flagged styling, overrides score checks
 * @property {string} [vibeText] - Complete vibe score label (e.g. "🏔️ Hardcore Adventurer")
 * @property {string} [activityType] - Key name of activity type
 * @property {'sm' | 'md'} [size] - Sizing scale (default: sm)
 * @property {string} [className] - Class overrides
 */

/**
 * Troopp Common Pill Indicator Component.
 * @param {BadgeProps} props
 */
const Badge = ({
  type = 'trust',
  score = 50,
  isFlagged = false,
  vibeText = '',
  activityType = '',
  size = 'sm',
  className
}) => {
  const isSmall = size === 'sm'



  // Render VibeBadge
  if (type === 'vibe') {
    return (
      <div
        className={clsx(
          'inline-flex items-center font-heading font-bold bg-gradient-to-r from-primary-light/50 to-orange-100 border border-primary/20 text-primary-dark rounded-full select-none',
          isSmall ? 'text-[10px] px-2.5 py-0.5' : 'text-xs px-3 py-1',
          className
        )}
      >
        <span>{vibeText}</span>
      </div>
    )
  }

  // Render ActivityTypeBadge
  if (type === 'activity') {
    const activityConfig = {
      trek: { label: 'Trek', emoji: '🏔️' },
      road_trip: { label: 'Road Trip', emoji: '🚗' },
      cycling: { label: 'Cycling', emoji: '🚴' },
      night_drive: { label: 'Night Drive', emoji: '🌙' },
      camping: { label: 'Camping', emoji: '⛺' },
      heritage_walk: { label: 'Heritage Walk', emoji: '🏛️' },
      photography_walk: { label: 'Photography Walk', emoji: '📸' },
      day_trip: { label: 'Day Trip', emoji: '✨' }
    }

    const config = activityConfig[activityType.toLowerCase()] || { label: 'Activity', emoji: '🌍' }

    return (
      <div
        className={clsx(
          'inline-flex items-center gap-1 font-sans font-bold bg-border/40 text-text-primary rounded-full select-none',
          isSmall ? 'text-[10px] px-2 h-5' : 'text-xs px-3 h-6.5',
          className
        )}
      >
        <span aria-hidden="true">{config.emoji}</span>
        <span>{config.label}</span>
      </div>
    )
  }

  return null
}

export default Badge
export { Badge }
