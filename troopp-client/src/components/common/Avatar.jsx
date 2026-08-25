import React from 'react'
import clsx from 'clsx'
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
  showStatusRing = false,
  borderColor,
  className,
  style
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

  // Safe name fallback
  const safeName = typeof name === 'string' && name.trim() ? name.trim() : 'Anonymous User'

  // Generates initials from name: e.g. "Raj Malhotra" -> "RM"
  const getInitials = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'AU'
    const parts = fullName.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2 && parts[0] && parts[1] && parts[0][0] && parts[1][0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return (fullName.trim().slice(0, 2) || 'AU').toUpperCase()
  }

  const getGradientForName = (fullName) => {
    const gradients = [
      'linear-gradient(135deg, #ff6a2c 0%, #d9481a 100%)', // terracotta
      'linear-gradient(135deg, #4fbe8e 0%, #369b70 100%)', // moss green
      'linear-gradient(135deg, #ffc94d 0%, #d99f26 100%)', // amber
      'linear-gradient(135deg, #212b33 0%, #1a2129 100%)', // raised surface dark
      'linear-gradient(135deg, #2a3b47 0%, #212b33 100%)'  // navy raised dark
    ]
    const str = typeof fullName === 'string' && fullName ? fullName : 'User'
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % gradients.length
    return gradients[index]
  }

  const initials = getInitials(safeName)
  const fallbackGradient = getGradientForName(safeName)

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

  const getStatusColor = (s) => {
    if (s === undefined || s === null) return null
    if (s >= 75) return 'var(--moss)' // Trusted Legend green
    return 'var(--accent)'            // Terracotta accent
  }

  const statusColor = showStatusRing ? getStatusColor(score) : null

  const customStyle = {
    ...style,
    borderColor: borderColor || (statusColor ? 'var(--color-surface)' : 'rgba(255,255,255,0.08)')
  }

  if (statusColor) {
    customStyle.outline = `2px solid ${statusColor}`
    customStyle.outlineOffset = '2.5px'
  }

  return (
    <div 
      className={clsx(
        'relative inline-flex flex-shrink-0 select-none rounded-full border-2 shadow-md bg-[#212b33]', 
        sizeClasses[size], 
        className
      )}
      style={customStyle}
    >
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
          className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-[#22C55E] border-2 border-[var(--color-surface)] rounded-full shadow-sm"
          title="Online"
        />
      )}

    </div>
  )
}

export default Avatar
export { Avatar }
