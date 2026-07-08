import React from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import Badge from './Badge.jsx'
import { getTransformedImageUrl, CLOUDINARY_TRANSFORMS } from '../../utils/cloudinary.js'

/**
 * @typedef {Object} AvatarProps
 * @property {string} [src] - URL of profile photo
 * @property {string} name - Full user name (used to generate double initial fallback)
 * @property {'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'} [size] - Avatar size scale
 * @property {boolean} [showBadge] - If true, overlays a trust badge in the bottom-right corner
 * @property {number} [score] - User trust score (0-100)
 * @property {boolean} [isOnline] - If true, displays a green online indicator dot
 * @property {string} [className] - Class overrides
 */

/**
 * Troopp Common Avatar Component with fallback and status overlays.
 * @param {AvatarProps} props
 */
const Avatar = ({
  src,
  name = 'Anonymous User',
  size = 'md',
  showBadge = false,
  score = 50,
  isOnline = false,
  className
}) => {
  // Sizing styles mapping
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-[12px]',
    md: 'w-10 h-10 text-[14px]',
    lg: 'w-14 h-14 text-[16px]',
    xl: 'w-20 h-20 text-[22px]',
    xxl: 'w-[120px] h-[120px] text-[36px]'
  }

  // Generates initials from name: e.g. "Raj Malhotra" -> "RM"
  const getInitials = (fullName) => {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return fullName.slice(0, 2).toUpperCase()
  }

  const getGradientForName = (fullName) => {
    const gradients = [
      'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
      'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      'linear-gradient(135deg, #10B981 0%, #047857 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
      'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
      'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
      'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    ]
    let hash = 0
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % gradients.length
    return gradients[index]
  }

  const initials = getInitials(name)
  const fallbackGradient = getGradientForName(name)

  const getTransformForSize = (sz) => {
    if (sz === 'lg' || sz === 'xl' || sz === 'xxl') {
      return CLOUDINARY_TRANSFORMS.PROFILE_AVATAR
    }
    if (sz === 'md') {
      return CLOUDINARY_TRANSFORMS.TRUST_SNAPSHOT
    }
    return CLOUDINARY_TRANSFORMS.CHAT_AVATAR
  }

  const transformedSrc = src ? getTransformedImageUrl(src, getTransformForSize(size)) : null

  return (
    <div className={clsx('relative inline-flex flex-shrink-0 select-none rounded-full border-2 border-white shadow-sm bg-stone-100', sizeClasses[size], className)}>
      {/* Avatar Image or Initial Fallback */}
      {transformedSrc ? (
        <img
          src={transformedSrc}
          alt={name}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            // Remove broken image source to trigger fallback rendering
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      ) : null}

      <div
        className={clsx(
          'w-full h-full flex items-center justify-center rounded-full text-white font-bold font-body select-none',
          src && 'hidden' // Hidden by default if src is loaded, shown if error occurs
        )}
        style={{ background: fallbackGradient }}
      >
        {initials}
      </div>

      {/* Online indicator dot */}
      {isOnline && (
        <span
          className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-[#22C55E] border-2 border-white rounded-full shadow-sm"
          title="Online"
        />
      )}

      {/* Trust Badge overlay (lg size and above only for visual spacing) */}
      {showBadge && (size === 'lg' || size === 'xl' || size === 'xxl') && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ type: 'spring', stiffness: 350, damping: 18, delay: 0.15 }}
          className="absolute -bottom-1 -right-2 z-10"
        >
          <Badge type="trust" score={score} size="sm" className="shadow-md" />
        </motion.div>
      )}
    </div>
  )
}

export default Avatar
export { Avatar }
